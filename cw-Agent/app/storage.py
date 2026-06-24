import os
from urllib.parse import quote

from fastapi import HTTPException

from app.config import (
    OSS_ACCESS_KEY_ID,
    OSS_ACCESS_KEY_SECRET,
    OSS_BUCKET_NAME,
    OSS_ENABLED,
    OSS_ENDPOINT,
    OSS_OBJECT_PREFIX,
    OSS_PUBLIC_BASE_URL,
    OSS_SIGNED_URL_EXPIRES,
)
from app.models import AudioOutput, SubtitleOutput


def _require_oss_config():
    missing = []
    for name, value in {
        "OSS_ACCESS_KEY_ID": OSS_ACCESS_KEY_ID,
        "OSS_ACCESS_KEY_SECRET": OSS_ACCESS_KEY_SECRET,
        "OSS_ENDPOINT": OSS_ENDPOINT,
        "OSS_BUCKET_NAME": OSS_BUCKET_NAME,
    }.items():
        if not value:
            missing.append(name)
    if missing:
        raise HTTPException(status_code=500, detail=f"OSS config missing: {', '.join(missing)}")


def _get_bucket():
    _require_oss_config()
    import oss2

    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    return oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME)


def _object_key(file_path: str) -> str:
    filename = os.path.basename(file_path)
    prefix = (OSS_OBJECT_PREFIX or "").strip().strip("/")
    if not prefix:
        return filename
    return f"{prefix}/{filename}"


def _public_download_url(object_key: str) -> str:
    base = OSS_PUBLIC_BASE_URL.rstrip("/")
    quoted_key = "/".join(quote(part) for part in object_key.split("/"))
    return f"{base}/{quoted_key}"


def _download_url(bucket, object_key: str) -> str:
    if OSS_PUBLIC_BASE_URL:
        return _public_download_url(object_key)
    return bucket.sign_url("GET", object_key, OSS_SIGNED_URL_EXPIRES)


def _upload_file(bucket, file_path: str) -> str:
    if not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail=f"Generated file not found: {file_path}")
    object_key = _object_key(file_path)
    bucket.put_object_from_file(object_key, file_path)
    return _download_url(bucket, object_key)


def upload_generated_outputs(audio: AudioOutput, subtitle: SubtitleOutput) -> tuple[AudioOutput, SubtitleOutput]:
    if not OSS_ENABLED:
        return audio, subtitle

    bucket = _get_bucket()
    audio_url = _upload_file(bucket, audio.file_path)
    subtitle_url = _upload_file(bucket, subtitle.srt_file_path)
    return (
        audio.model_copy(update={"download_url": audio_url}),
        subtitle.model_copy(update={"download_url": subtitle_url}),
    )
