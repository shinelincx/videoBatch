import os
import sys
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import verify_token
from app.models import AudioOutput, MarketingCopy, SubtitleOutput


class DummyBucket:
    def __init__(self):
        self.uploads = []

    def put_object_from_file(self, object_key, file_path):
        self.uploads.append((object_key, file_path))

    def sign_url(self, method, object_key, expires):
        return f"https://signed.example.com/{object_key}?expires={expires}"


class TestOssStorage(unittest.TestCase):
    def test_upload_outputs_returns_original_when_oss_disabled(self):
        from app.storage import upload_generated_outputs

        audio = AudioOutput(file_path="output/a.mp3", duration=1.0)
        subtitle = SubtitleOutput(srt_file_path="output/a.srt", entries=[])

        with patch("app.storage.OSS_ENABLED", False):
            uploaded_audio, uploaded_subtitle = upload_generated_outputs(audio, subtitle)

        self.assertIs(uploaded_audio, audio)
        self.assertIs(uploaded_subtitle, subtitle)
        self.assertIsNone(uploaded_audio.download_url)
        self.assertIsNone(uploaded_subtitle.download_url)

    def test_upload_outputs_uploads_files_and_sets_signed_urls(self):
        from app.storage import upload_generated_outputs

        bucket = DummyBucket()
        with tempfile.TemporaryDirectory() as tmpdir:
            audio_path = os.path.join(tmpdir, "audio.mp3")
            subtitle_path = os.path.join(tmpdir, "subtitle.srt")
            with open(audio_path, "wb") as f:
                f.write(b"audio")
            with open(subtitle_path, "w", encoding="utf-8") as f:
                f.write("1\n00:00:00,000 --> 00:00:01,000\nhello\n")

            audio = AudioOutput(file_path=audio_path, duration=1.0)
            subtitle = SubtitleOutput(srt_file_path=subtitle_path, entries=[])

            with (
                patch("app.storage.OSS_ENABLED", True),
                patch("app.storage.OSS_BUCKET_NAME", "cw-bucket"),
                patch("app.storage.OSS_OBJECT_PREFIX", "cw-agent"),
                patch("app.storage.OSS_SIGNED_URL_EXPIRES", 600),
                patch("app.storage._get_bucket", return_value=bucket),
            ):
                uploaded_audio, uploaded_subtitle = upload_generated_outputs(audio, subtitle)

        self.assertEqual(len(bucket.uploads), 2)
        self.assertEqual(bucket.uploads[0][0], "cw-agent/audio.mp3")
        self.assertEqual(bucket.uploads[1][0], "cw-agent/subtitle.srt")
        self.assertEqual(uploaded_audio.download_url, "https://signed.example.com/cw-agent/audio.mp3?expires=600")
        self.assertEqual(uploaded_subtitle.download_url, "https://signed.example.com/cw-agent/subtitle.srt?expires=600")


class TestOssLinksInRoute(unittest.TestCase):
    def test_generate_route_returns_oss_download_urls(self):
        from app.routes import router

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[verify_token] = lambda: "test"
        client = TestClient(app)

        uploaded_audio = AudioOutput(
            file_path="output/test.mp3",
            duration=1.0,
            download_url="https://oss.example.com/test.mp3",
        )
        uploaded_subtitle = SubtitleOutput(
            srt_file_path="output/test.srt",
            entries=[],
            download_url="https://oss.example.com/test.srt",
        )

        with (
            patch("app.routes.generate_copy", new=AsyncMock(return_value=MarketingCopy(title="", tags=[], text="正文", word_count=2, estimated_duration=1.0))),
            patch("app.routes.text_to_speech", new=AsyncMock(return_value=(AudioOutput(file_path="output/test.mp3", duration=1.0), []))),
            patch("app.routes.generate_srt", return_value=SubtitleOutput(srt_file_path="output/test.srt", entries=[])),
            patch("app.routes.upload_generated_outputs", return_value=(uploaded_audio, uploaded_subtitle)),
            patch("app.routes.clean_old_outputs"),
            patch("app.routes.get_last_match_result", return_value=None),
        ):
            response = client.post(
                "/api/generate",
                json={
                    "category": "美妆",
                    "title": "面霜",
                    "selling_points": ["补水"],
                    "duration": 30,
                    "platform": "抖音",
                    "tone": "简洁",
                    "language": "zh",
                    "voice": "",
                },
            )

        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["audio"]["download_url"], "https://oss.example.com/test.mp3")
        self.assertEqual(body["subtitle"]["download_url"], "https://oss.example.com/test.srt")
