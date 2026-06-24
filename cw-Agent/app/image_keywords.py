import base64
import json
import re
from typing import List

import httpx
from fastapi import HTTPException, UploadFile
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.config import VISION_LLM_API_KEY, VISION_LLM_BASE_URL, VISION_LLM_MODEL

MAX_IMAGE_COUNT = 6
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_KEYWORDS = 12
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def validate_image_uploads(images: List[UploadFile]) -> list[dict]:
    if not images:
        raise HTTPException(status_code=422, detail="At least one image is required")
    if len(images) > MAX_IMAGE_COUNT:
        raise HTTPException(status_code=422, detail=f"Upload at most {MAX_IMAGE_COUNT} images")

    payloads = []
    for image in images:
        content_type = (image.content_type or "").lower()
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Only jpeg, png, and webp images are supported")

        data = await image.read()
        await image.seek(0)
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Each image must be 8MB or smaller")
        if not data:
            raise HTTPException(status_code=422, detail="Image file cannot be empty")

        payloads.append({
            "filename": image.filename or "image",
            "content_type": content_type,
            "data": data,
        })
    return payloads


def _strip_json_fence(raw_output: str) -> str:
    text = (raw_output or "").strip()
    match = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()
    return text


def _parse_keyword_response(raw_output: str) -> list[str]:
    text = _strip_json_fence(raw_output)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Vision model returned invalid keyword JSON") from exc

    keywords = data.get("keywords") if isinstance(data, dict) else None
    if not isinstance(keywords, list):
        raise HTTPException(status_code=502, detail="Vision model response must contain a keywords list")

    cleaned = []
    seen = set()
    for keyword in keywords:
        if not isinstance(keyword, str):
            continue
        item = keyword.strip()
        if not item:
            continue
        key = item.casefold()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(item)
        if len(cleaned) >= MAX_KEYWORDS:
            break

    if not cleaned:
        raise HTTPException(status_code=422, detail="No usable keywords were extracted from the images")
    return cleaned


def _build_vision_prompt(category: str, title: str, language: str) -> str:
    return (
        "Analyze the uploaded e-commerce product images and extract concise marketing keywords. "
        "Focus on visible product type, material, color, style, usage scene, texture, packaging, and benefits that can be inferred visually. "
        "Do not invent price, discounts, brand claims, certifications, ingredients, or performance claims that are not visible. "
        f"Product category: {category}. Product title: {title}. Output language code: {language}. "
        f"Return strict JSON only, with this shape: {{\"keywords\":[\"keyword1\",\"keyword2\"]}}. "
        f"Return 6 to {MAX_KEYWORDS} short keywords when possible."
    )


def _image_to_message_part(payload: dict) -> dict:
    encoded = base64.b64encode(payload["data"]).decode("ascii")
    return {
        "type": "image_url",
        "image_url": {"url": f"data:{payload['content_type']};base64,{encoded}"},
    }


async def extract_image_keywords(
    images: List[UploadFile],
    category: str,
    title: str,
    language: str,
) -> list[str]:
    if not VISION_LLM_API_KEY or not VISION_LLM_BASE_URL or not VISION_LLM_MODEL:
        raise HTTPException(
            status_code=500,
            detail="VISION_LLM_API_KEY, VISION_LLM_BASE_URL, and VISION_LLM_MODEL must be configured for image mode",
        )

    payloads = await validate_image_uploads(images)
    content = [{"type": "text", "text": _build_vision_prompt(category, title, language)}]
    content.extend(_image_to_message_part(payload) for payload in payloads)

    llm = ChatOpenAI(
        api_key=VISION_LLM_API_KEY,
        base_url=VISION_LLM_BASE_URL,
        model=VISION_LLM_MODEL,
        temperature=0.2,
        http_client=httpx.Client(verify=False, timeout=120),
    )
    result = await llm.ainvoke([HumanMessage(content=content)])
    return _parse_keyword_response(result.content)
