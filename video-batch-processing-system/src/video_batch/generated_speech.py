"""Local text-to-speech generation for generated marketing copy."""

import asyncio
import os
import re
import ssl
from pathlib import Path


class TtsDependencyError(RuntimeError):
    """Raised when local TTS runtime dependencies are unavailable."""
    pass


LANGUAGE_VOICE_MAP = {
    "zh": "zh-CN-XiaoxiaoNeural",
    "en": "en-US-JennyNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "th": "th-TH-NiwatNeural",
    "vi": "vi-VN-HoaiMyNeural",
    "id": "id-ID-GadisNeural",
    "ms": "ms-MY-YasminNeural",
    "fil": "fil-PH-BlessicaNeural",
    "my": "my-MM-NilarNeural",
    "km": "km-KH-SreymomNeural",
    "lo": "lo-LA-KeomanyNeural",
}

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

_ABBREVIATIONS = {
    "ROI": "return on investment",
    "KOL": "key opinion leader",
    "UGC": "user generated content",
    "CTA": "call to action",
    "SKU": "S K U",
    "API": "A P I",
    "SEO": "S E O",
    "CRM": "C R M",
    "KPI": "K P I",
    "FAQ": "F A Q",
    "VIP": "V I P",
}

_RE_ABBR = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(_ABBREVIATIONS, key=len, reverse=True)) + r")(s)?\b",
    re.IGNORECASE,
)


def get_tts_voice(language: str) -> str:
    return LANGUAGE_VOICE_MAP.get(language, LANGUAGE_VOICE_MAP["zh"])


def clean_for_speech(text: str) -> str:
    text = _SPEECH_SAFE_PATTERN.sub("", text or "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def expand_abbreviations(text: str) -> str:
    def replace(match: re.Match) -> str:
        word = match.group(1)
        suffix = match.group(2) or ""
        replacement = _ABBREVIATIONS.get(word.upper(), word)
        return replacement + suffix.lower()

    return _RE_ABBR.sub(replace, text or "")


def analyze_emotion(text: str, language: str = "zh") -> tuple[str, str]:
    if not text:
        return "+0%", "+0Hz"
    exclamations = text.count("!") + text.count("！")
    questions = text.count("?") + text.count("？")
    rate_delta = min(15, exclamations * 4 + questions * 2)
    pitch_delta = min(10, exclamations * 3 + questions * 2)
    if language in {"ja", "th", "my", "km", "lo"}:
        rate_delta = max(0, rate_delta - 3)
        pitch_delta = max(0, pitch_delta - 2)
    return "+%d%%" % rate_delta, "+%dHz" % pitch_delta


def generate_speech(
    text: str,
    output_path: Path,
    language: str = "zh",
    voice: str = "",
) -> list[dict]:
    return asyncio.run(generate_speech_async(text, output_path, language, voice))


def _load_tts_dependencies():
    try:
        import aiohttp
        import edge_tts
        import edge_tts.communicate as edge_communicate
    except ModuleNotFoundError as e:
        missing = e.name or "TTS dependency"
        if missing in {"aiohttp", "edge_tts"} or missing.startswith("edge_tts"):
            raise TtsDependencyError(
                "missing TTS dependency %s; install requirements.txt first" % missing
            ) from e
        raise
    return aiohttp, edge_tts, edge_communicate


async def generate_speech_async(
    text: str,
    output_path: Path,
    language: str = "zh",
    voice: str = "",
) -> list[dict]:
    aiohttp, edge_tts, edge_communicate = _load_tts_dependencies()

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    edge_communicate._SSL_CTX = ssl_ctx

    clean_text = clean_for_speech(expand_abbreviations(text))
    if not clean_text:
        raise ValueError("speech text is empty after cleaning")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    rate, pitch = analyze_emotion(clean_text, language)
    connector = aiohttp.TCPConnector(ssl=ssl_ctx)
    communicate = edge_tts.Communicate(
        clean_text,
        voice=voice or get_tts_voice(language),
        rate=rate,
        pitch=pitch,
        connector=connector,
        boundary="SentenceBoundary",
    )

    boundaries: list[dict] = []
    with output_path.open("wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] in ("WordBoundary", "word_boundary", "SentenceBoundary"):
                data = chunk.get("data", chunk)
                boundaries.append({
                    "text": data["text"],
                    "offset": data["offset"],
                    "duration": data["duration"],
                })

    if not output_path.exists() or output_path.stat().st_size <= 0:
        raise ValueError("generated speech file is empty: %s" % output_path)
    if not boundaries:
        boundaries = _fallback_boundary(clean_text, output_path)
    return boundaries


def _fallback_boundary(text: str, output_path: Path) -> list[dict]:
    file_size = max(os.path.getsize(output_path), 1)
    duration_ticks = max(int(file_size / 16000.0 * 10_000_000), 1_000_000)
    return [{"text": text, "offset": 0, "duration": duration_ticks}]
