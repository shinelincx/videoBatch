from typing import List

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from app.models import CopyOnlyInput, CopyOnlyResponse, ProductInput, AgentResponse
from app.agent import generate_copy, generate_copy_with_usage, get_last_match_result
from app.image_keywords import extract_image_keywords
from app.storage import upload_generated_outputs
from app.tts import text_to_speech
from app.subtitle import generate_srt
from app.config import get_voice_options, get_default_voice
from app.config import TREND_API_TOKEN, TREND_DB_PATH
from app.cleanup import clean_old_outputs
from app.auth import verify_token, get_token_store
from app.trends import TrendIngestor
import os
import time

router = APIRouter()


# Token 管理请求模型
class CreateTokenRequest(BaseModel):
    description: str = Field(default="", description="Token 描述")


class DouyinTrendVideosRequest(BaseModel):
    items: List[dict] = Field(default_factory=list, description="抖音热门视频采集数据")


# 条件认证依赖：仅在 AUTH_ENABLED 时生效
def _auth():
    return Depends(verify_token)


def verify_trend_token(authorization: str = Header(default="")):
    if not TREND_API_TOKEN:
        return True
    expected = f"Bearer {TREND_API_TOKEN}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid trend API token")
    return True


async def _run_generation(product_input: ProductInput, image_keywords: list[str] = None) -> AgentResponse:
    clean_old_outputs("output")
    copy = await generate_copy(product_input)
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    audio_path = f"output/{timestamp}_audio.mp3"
    audio_output, word_boundaries = await text_to_speech(copy.text, audio_path, product_input.language, product_input.voice)
    srt_path = f"output/{timestamp}_subtitle.srt"
    subtitle_output = generate_srt(word_boundaries, srt_path, product_input.language)
    audio_output, subtitle_output = upload_generated_outputs(audio_output, subtitle_output)

    match_result = get_last_match_result()
    skill_info = {
        "skill_name": match_result.skill.name if match_result else "unknown",
        "match_type": match_result.match_type.value if match_result else "unknown",
        "matched_by": match_result.matched_by if match_result else "",
        "skill_description": match_result.skill.description if match_result else "",
    }

    return AgentResponse(
        input=product_input,
        marketing_copy=copy,
        audio=audio_output,
        subtitle=subtitle_output,
        image_keywords=image_keywords,
        skill_info=skill_info,
    )


def _skill_info_from_last_match() -> dict:
    match_result = get_last_match_result()
    return {
        "skill_name": match_result.skill.name if match_result else "unknown",
        "match_type": match_result.match_type.value if match_result else "unknown",
        "matched_by": match_result.matched_by if match_result else "",
        "skill_description": match_result.skill.description if match_result else "",
    }


async def _run_copy_only_generation(copy_input: CopyOnlyInput, image_keywords: list[str] = None) -> CopyOnlyResponse:
    copy, token_usage = await generate_copy_with_usage(copy_input.to_product_input())
    return CopyOnlyResponse(
        input=copy_input,
        marketing_copy=copy,
        skill_info=_skill_info_from_last_match(),
        token_usage=token_usage,
        image_keywords=image_keywords,
    )


@router.post("/api/generate", response_model=AgentResponse)
async def api_generate(product_input: ProductInput, _=Depends(verify_token)):
    try:
        return await _run_generation(product_input)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/generate/images", response_model=AgentResponse)
async def api_generate_images(
    category: str = Form(...),
    title: str = Form(...),
    duration: int = Form(30),
    platform: str = Form("抖音"),
    tone: str = Form("简洁"),
    language: str = Form("zh"),
    voice: str = Form(""),
    images: List[UploadFile] = File(...),
    _=Depends(verify_token),
):
    try:
        image_keywords = await extract_image_keywords(images, category=category, title=title, language=language)
        product_input = ProductInput(
            category=category,
            title=title,
            selling_points=image_keywords,
            duration=duration,
            platform=platform,
            tone=tone,
            language=language,
            voice=voice,
        )
        return await _run_generation(product_input, image_keywords=image_keywords)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v2/generate-copy", response_model=CopyOnlyResponse)
async def api_v2_generate_copy(copy_input: CopyOnlyInput, _=Depends(verify_token)):
    try:
        return await _run_copy_only_generation(copy_input)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v2/generate-copy/images", response_model=CopyOnlyResponse)
async def api_v2_generate_copy_images(
    category: str = Form(...),
    title: str = Form(...),
    duration: int = Form(30),
    platform: str = Form("抖音"),
    language: str = Form("zh"),
    images: List[UploadFile] = File(...),
    _=Depends(verify_token),
):
    try:
        image_keywords = await extract_image_keywords(images, category=category, title=title, language=language)
        copy_input = CopyOnlyInput(
            category=category,
            title=title,
            selling_points=image_keywords,
            duration=duration,
            platform=platform,
            language=language,
        )
        return await _run_copy_only_generation(copy_input, image_keywords=image_keywords)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/trends/douyin/videos")
async def api_ingest_douyin_trend_videos(
    payload: DouyinTrendVideosRequest,
    _=Depends(verify_trend_token),
):
    try:
        return TrendIngestor(db_path=TREND_DB_PATH).ingest_douyin(payload.items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/audio/{filename}")
async def api_get_audio(filename: str):
    file_path = os.path.join("output", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg")


@router.get("/api/subtitle/{filename}")
async def api_get_subtitle(filename: str):
    file_path = os.path.join("output", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Subtitle file not found")
    return FileResponse(file_path, media_type="text/plain; charset=utf-8")


@router.get("/api/voices/{language}")
async def api_get_voices(language: str):
    options = get_voice_options(language)
    return {"voices": options, "default": get_default_voice(language)}


# Token 管理接口
@router.post("/api/token")
async def create_token(req: CreateTokenRequest, _=Depends(verify_token)):
    """创建新 token（返回完整 token，仅此一次可见）"""
    store = get_token_store()
    key = store.create(req.description)
    return {"token": key, "description": req.description}


@router.get("/api/tokens")
async def list_tokens(_=Depends(verify_token)):
    """列出所有 token（脱敏显示）"""
    store = get_token_store()
    return {"tokens": store.list_tokens()}


@router.delete("/api/token/{key}")
async def revoke_token(key: str, _=Depends(verify_token)):
    """撤销（禁用）指定 token"""
    store = get_token_store()
    if store.revoke(key):
        return {"message": "Token 已撤销"}
    raise HTTPException(status_code=404, detail="Token 不存在")
