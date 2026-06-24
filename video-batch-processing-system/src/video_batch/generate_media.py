"""Generate copy through cw-Agent v2, then build local subtitle/audio assets."""

import json
import math
import mimetypes
from dataclasses import dataclass
from pathlib import Path

try:
    import oss2
except ImportError:  # pragma: no cover - exercised only when dependency is absent
    class _MissingOss2:
        def Auth(self, *_args, **_kwargs):
            raise GenerateMediaError("missing oss2 dependency; install requirements.txt first")

        def Bucket(self, *_args, **_kwargs):
            raise GenerateMediaError("missing oss2 dependency; install requirements.txt first")

    oss2 = _MissingOss2()

from video_batch.generated_speech import generate_speech
from video_batch.generated_subtitle import generate_srt


class GenerateApiConfigError(Exception):
    """Generate API configuration error."""
    pass


class GenerateMediaError(Exception):
    """Subtitle/audio generation error."""
    pass


@dataclass(frozen=True)
class OssConfig:
    access_key_id: str
    access_key_secret: str
    endpoint: str
    bucket: str


@dataclass(frozen=True)
class GenerateApiConfig:
    api_token: str
    oss: OssConfig
    base_url: str = "http://localhost:8000"
    copy_endpoint: str = "/api/v2/generate-copy"
    image_copy_endpoint: str = "/api/v2/generate-copy/images"

    @staticmethod
    def load(path: Path) -> "GenerateApiConfig":
        path = Path(path)
        if not path.exists():
            raise GenerateApiConfigError("generate_api_config.json does not exist: %s" % path)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise GenerateApiConfigError("generate_api_config.json format error: %s" % e) from e
        return GenerateApiConfig.from_dict(data)

    @staticmethod
    def from_dict(data: dict) -> "GenerateApiConfig":
        base_url = str(data.get("base_url", "")).strip().rstrip("/")
        if not base_url:
            base_url = "http://localhost:8000"

        api_token = str(data.get("api_token", "")).strip()
        if not api_token:
            raise GenerateApiConfigError("api_token cannot be empty")

        oss_data = data.get("oss", {})
        if not isinstance(oss_data, dict):
            raise GenerateApiConfigError("oss config must be an object")

        required = ("access_key_id", "access_key_secret", "endpoint", "bucket")
        values: dict[str, str] = {}
        for key in required:
            value = str(oss_data.get(key, "")).strip()
            if not value:
                raise GenerateApiConfigError("oss.%s cannot be empty" % key)
            values[key] = value

        return GenerateApiConfig(
            api_token=api_token,
            oss=OssConfig(
                access_key_id=values["access_key_id"],
                access_key_secret=values["access_key_secret"],
                endpoint=values["endpoint"],
                bucket=values["bucket"],
            ),
            base_url=base_url,
            copy_endpoint=_normalize_endpoint(
                data.get("copy_endpoint"),
                "/api/v2/generate-copy",
            ),
            image_copy_endpoint=_normalize_endpoint(
                data.get("image_copy_endpoint"),
                "/api/v2/generate-copy/images",
            ),
        )


@dataclass(frozen=True)
class GeneratedMediaResult:
    srt_path: Path
    mp3_path: Path


class GenerateMediaClient:
    """Client for cw-Agent v2 copy generation plus local TTS/SRT generation."""

    CATEGORY = "服装"
    TITLE = "纯棉短袖七分裤运动套装女夏季2026新款广场舞服装团体休闲两件套"
    SELLING_POINTS = ["两件套", "休闲风", "纯棉"]
    PLATFORM = "抖音"
    LANGUAGE = "zh"
    VOICE = ""

    def __init__(
        self,
        config: GenerateApiConfig,
        base_url: str,
        http_session,
        scratch_dir: Path,
    ) -> None:
        self._config = config
        self._base_url = base_url.rstrip("/")
        self._http = http_session
        self._scratch_dir = Path(scratch_dir)

    def generate(
        self,
        task_id: str,
        product_id: str,
        config_id: str,
        duration: float,
        category: str = "",
        title: str = "",
        selling_points: str | list[str] | None = None,
        image_path: Path | None = None,
    ) -> GeneratedMediaResult:
        payload = self._build_payload(
            task_id=task_id,
            product_id=product_id,
            config_id=config_id,
            duration=duration,
            category=category,
            title=title,
            selling_points=selling_points,
        )
        headers = {"Authorization": "Bearer %s" % self._config.api_token}
        endpoint = (
            self._config.image_copy_endpoint
            if image_path is not None
            else self._config.copy_endpoint
        )

        try:
            response = self._post_copy(endpoint, payload, headers, image_path)
            if response.status_code in (404, 405):
                endpoint = _legacy_copy_endpoint(image_path)
                response = self._post_copy(endpoint, payload, headers, image_path)
        except Exception as e:
            if isinstance(e, GenerateMediaError):
                raise
            raise GenerateMediaError("%s request failed: %s" % (endpoint, e)) from e

        if response.status_code != 200:
            raise GenerateMediaError(
                "%s returned HTTP %d: %s" % (
                    endpoint,
                    response.status_code,
                    getattr(response, "text", ""),
                ),
            )

        copy_text = _extract_copy_text(response.json())
        if not copy_text:
            raise GenerateMediaError("response missing marketing_copy.text or text")

        safe_task_id = _safe_name(task_id)
        srt_path = self._scratch_dir / "subtitles" / ("generated_%s.srt" % safe_task_id)
        mp3_path = self._scratch_dir / "audio" / ("generated_%s.mp3" % safe_task_id)
        mp3_path.parent.mkdir(parents=True, exist_ok=True)
        srt_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            word_boundaries = generate_speech(
                text=copy_text,
                output_path=mp3_path,
                language=self.LANGUAGE,
                voice=self.VOICE,
            )
        except Exception as e:
            raise GenerateMediaError("audio generation failed: %s" % e) from e

        try:
            generate_srt(word_boundaries, srt_path, self.LANGUAGE)
        except Exception as e:
            raise GenerateMediaError("subtitle generation failed: %s" % e) from e

        return GeneratedMediaResult(srt_path=srt_path, mp3_path=mp3_path)

    def _build_payload(
        self,
        task_id: str,
        product_id: str,
        config_id: str,
        duration: float,
        category: str,
        title: str,
        selling_points: str | list[str] | None,
    ) -> dict:
        resolved_category = _non_empty(category, self.CATEGORY)
        resolved_title = _non_empty(title, self.TITLE)
        return {
            "category": resolved_category,
            "title": resolved_title,
            "selling_points": _selling_points_list(
                selling_points,
                self.SELLING_POINTS,
            ),
            "duration": max(1, int(math.ceil(float(duration)))),
            "platform": self.PLATFORM,
            "tone": "default",
            "style": "default",
            "language": self.LANGUAGE,
            "voice": self.VOICE,
            "sound": "default",
            "task_id": task_id,
            "product_id": product_id,
            "config_id": config_id,
        }

    def _post_copy(
        self,
        endpoint: str,
        payload: dict,
        headers: dict,
        image_path: Path | None,
    ):
        if image_path is None:
            return self._http.post(
                "%s%s" % (self._base_url, endpoint),
                json=payload,
                headers=headers,
            )

        image_path = Path(image_path)
        if not image_path.exists():
            raise GenerateMediaError("image file does not exist: %s" % image_path)

        form_data = {
            "category": payload["category"],
            "title": payload["title"],
            "duration": str(payload["duration"]),
            "platform": payload["platform"],
            "tone": payload["tone"],
            "language": payload["language"],
            "voice": payload["voice"],
        }
        with image_path.open("rb") as image_file:
            return self._http.post(
                "%s%s" % (self._base_url, endpoint),
                data=form_data,
                files={
                    "images": (
                        image_path.name,
                        image_file,
                        _mime_type_for_path(image_path),
                    ),
                },
                headers=headers,
            )


def build_generate_duration(
    mode: str,
    material_index,
    image_duration: float,
    img_video_position: str,
    reference_video: Path | None = None,
    duration_probe=None,
    loop_count: int = 1,
) -> float:
    image_count = len(getattr(material_index, "images", []) or [])
    image_total = image_count * float(image_duration)
    repeat = max(1, int(loop_count or 1))
    if mode == "image-to-video":
        return round(image_total * repeat, 3)

    video_duration = 0.0
    if reference_video is not None and duration_probe is not None:
        video_duration = float(duration_probe(reference_video))
    elif getattr(material_index, "videos", None):
        videos = getattr(material_index, "videos")
        if videos and duration_probe is not None:
            video_duration = float(duration_probe(videos[0].path))

    if img_video_position == "none":
        image_total = 0.0
    return round((video_duration + image_total) * repeat, 3)


def _extract_copy_text(data: dict) -> str:
    text = _nested_str(data, "marketing_copy", "text")
    if text:
        return text
    return str(data.get("text", "") or "").strip()


def _nested_str(data: dict, *keys: str) -> str:
    value = data
    for key in keys:
        if not isinstance(value, dict):
            return ""
        value = value.get(key)
    return str(value or "").strip()


def _normalize_endpoint(value, fallback: str) -> str:
    endpoint = str(value or "").strip()
    if not endpoint:
        endpoint = fallback
    if not endpoint.startswith("/"):
        endpoint = "/" + endpoint
    return endpoint


def _legacy_copy_endpoint(image_path: Path | None) -> str:
    return "/api/generate/images" if image_path is not None else "/api/generate"


def _non_empty(value: str | None, fallback: str) -> str:
    value = str(value or "").strip()
    return value or fallback


def _selling_points_list(value: str | list[str] | None, fallback: list[str]) -> list[str]:
    if isinstance(value, list):
        points = [str(item).strip() for item in value if str(item).strip()]
    else:
        text = str(value or "").strip()
        points = [text] if text else []
    return points or list(fallback)


def _safe_name(value: str) -> str:
    return "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in value)


def _mime_type_for_path(path: Path) -> str:
    return mimetypes.guess_type(str(path))[0] or "application/octet-stream"
