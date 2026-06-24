import asyncio
import os
import re
import ssl

import aiohttp
import edge_tts
import edge_tts.communicate as _edge_comm

from app.config import get_tts_voice, EMOTION_ENABLED
from app.models import AudioOutput
from app.abbreviation import expand_abbreviations
from app.emotion import analyze_emotion, get_rate_multiplier

_patched_ssl = ssl.create_default_context()
_patched_ssl.check_hostname = False
_patched_ssl.verify_mode = ssl.CERT_NONE

_edge_comm._SSL_CTX = _patched_ssl

_SPEECH_SAFE_PATTERN = re.compile(
    "[^"
    "\u0020-\u007E"
    "\u00A0-\u00FF"
    "\u0E00-\u0E7F"
    "\u0E80-\u0EFF"
    "\u1000-\u109F"
    "\u1780-\u17FF"
    "\u2000-\u206F"
    "\u2100-\u214F"
    "\u3000-\u303F"
    "\u3040-\u309F"
    "\u30A0-\u30FF"
    "\u3400-\u4DBF"
    "\u4E00-\u9FFF"
    "\uAC00-\uD7AF"
    "\uFF00-\uFFEF"
    "]",
    re.UNICODE,
)


def _strip_for_speech(text: str) -> str:
    """移除文案中的 emoji / 表情符号 / 不可朗读字符"""
    text = _SPEECH_SAFE_PATTERN.sub("", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _get_ssl_connector():
    return aiohttp.TCPConnector(ssl=_patched_ssl)


async def text_to_speech(text: str, output_path: str, language: str, voice: str = "") -> tuple:
    """
    生成语音音频。

    处理流程：
      1. 展开缩写词
      2. 分析情感基调，推导 rate/pitch 参数
      3. 清洗不可朗读字符
      4. 调用 edge_tts 合成语音
    """
    if not voice:
        voice = get_tts_voice(language)

    # 步骤 1：展开缩写词
    text = expand_abbreviations(text, language)

    # 步骤 2：情感分析 → rate / pitch
    rate = "+0%"
    pitch = "+0Hz"
    if EMOTION_ENABLED:
        rate, pitch = analyze_emotion(text, language)

    # 步骤 3：清洗文本
    clean_text = _strip_for_speech(text)

    communicate = edge_tts.Communicate(
        clean_text,
        voice=voice,
        rate=rate,
        pitch=pitch,
        connector=_get_ssl_connector(),
        boundary="SentenceBoundary",
    )
    word_boundaries = []

    with open(output_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] in ("WordBoundary", "word_boundary", "SentenceBoundary"):
                data = chunk.get("data", chunk)
                word_boundaries.append({
                    "text": data["text"],
                    "offset": data["offset"],
                    "duration": data["duration"],
                })

    # 从 word_boundaries 时间戳计算真实音频时长（最精准）
    if word_boundaries:
        last_wb = word_boundaries[-1]
        real_duration = (last_wb["offset"] + last_wb["duration"]) / 10_000_000.0
    else:
        # 回退：文件大小 / 预估码率
        file_size = os.path.getsize(output_path)
        real_duration = file_size / 16000.0 if file_size > 0 else 0.0

    rate_multiplier = get_rate_multiplier(clean_text, language)
    effective_duration = real_duration if rate_multiplier == 1.0 else round(real_duration, 2)

    audio_output = AudioOutput(
        file_path=output_path, format="mp3", duration=effective_duration
    )
    return (audio_output, word_boundaries)


def text_to_speech_sync(text: str, output_path: str, language: str, voice: str = "") -> tuple:
    return asyncio.run(text_to_speech(text, output_path, language, voice))
