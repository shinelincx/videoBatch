import io
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import verify_token
from app.models import AudioOutput, MarketingCopy, SubtitleOutput


class FakeUpload:
    def __init__(self, filename, content_type, data):
        self.filename = filename
        self.content_type = content_type
        self._data = data

    async def read(self):
        return self._data

    async def seek(self, offset):
        return offset


class TestImageKeywordParsing(unittest.TestCase):
    def test_parse_keywords_from_json_deduplicates_and_limits(self):
        from app.image_keywords import _parse_keyword_response

        raw = '{"keywords":["补水","锁水","补水","轻薄","成分安全","敏感肌","夏季","清爽","不油腻","便携","高颜值","礼盒","多余"]}'

        self.assertEqual(
            _parse_keyword_response(raw),
            ["补水", "锁水", "轻薄", "成分安全", "敏感肌", "夏季", "清爽", "不油腻", "便携", "高颜值", "礼盒", "多余"],
        )

    def test_parse_keywords_from_fenced_json(self):
        from app.image_keywords import _parse_keyword_response

        raw = '```json\n{"keywords":["hydrating","lightweight"]}\n```'

        self.assertEqual(_parse_keyword_response(raw), ["hydrating", "lightweight"])

    def test_parse_keywords_rejects_empty_keywords(self):
        from app.image_keywords import _parse_keyword_response

        with self.assertRaises(HTTPException) as ctx:
            _parse_keyword_response('{"keywords":[]}')

        self.assertEqual(ctx.exception.status_code, 422)


class TestImageValidation(unittest.IsolatedAsyncioTestCase):
    async def test_validate_images_rejects_empty_list(self):
        from app.image_keywords import validate_image_uploads

        with self.assertRaises(HTTPException) as ctx:
            await validate_image_uploads([])

        self.assertEqual(ctx.exception.status_code, 422)

    async def test_validate_images_rejects_non_image_type(self):
        from app.image_keywords import validate_image_uploads

        upload = FakeUpload("notes.txt", "text/plain", b"hello")

        with self.assertRaises(HTTPException) as ctx:
            await validate_image_uploads([upload])

        self.assertEqual(ctx.exception.status_code, 415)

    async def test_validate_images_rejects_too_many_files(self):
        from app.image_keywords import validate_image_uploads, MAX_IMAGE_COUNT

        uploads = []
        for index in range(MAX_IMAGE_COUNT + 1):
            uploads.append(FakeUpload(f"{index}.png", "image/png", b"img"))

        with self.assertRaises(HTTPException) as ctx:
            await validate_image_uploads(uploads)

        self.assertEqual(ctx.exception.status_code, 422)

    async def test_validate_images_rejects_oversized_file(self):
        from app.image_keywords import MAX_IMAGE_BYTES, validate_image_uploads

        upload = FakeUpload("large.png", "image/png", b"x" * (MAX_IMAGE_BYTES + 1))

        with self.assertRaises(HTTPException) as ctx:
            await validate_image_uploads([upload])

        self.assertEqual(ctx.exception.status_code, 413)


class TestImageGenerateRoute(unittest.TestCase):
    def test_generate_json_route_still_accepts_existing_payload(self):
        from app.routes import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[verify_token] = lambda: "test"
        client = TestClient(app)

        with (
            patch("app.routes.generate_copy", new=AsyncMock(return_value=MarketingCopy(title="", tags=[], text="正文", word_count=2, estimated_duration=1.0))),
            patch("app.routes.text_to_speech", new=AsyncMock(return_value=(AudioOutput(file_path="output/test.mp3", duration=1.0), []))),
            patch("app.routes.generate_srt", return_value=SubtitleOutput(srt_file_path="output/test.srt", entries=[])),
            patch("app.routes.upload_generated_outputs", side_effect=lambda audio, subtitle: (audio, subtitle)),
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

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json().get("image_keywords"))

    def test_generate_images_route_uses_image_keywords_as_selling_points(self):
        from app.routes import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[verify_token] = lambda: "test"
        client = TestClient(app)

        with (
            patch("app.routes.extract_image_keywords", new=AsyncMock(return_value=["补水", "锁水"])),
            patch("app.routes.generate_copy", new=AsyncMock(return_value=MarketingCopy(title="", tags=[], text="正文", word_count=2, estimated_duration=1.0))),
            patch("app.routes.text_to_speech", new=AsyncMock(return_value=(AudioOutput(file_path="output/test.mp3", duration=1.0), []))),
            patch("app.routes.generate_srt", return_value=SubtitleOutput(srt_file_path="output/test.srt", entries=[])),
            patch("app.routes.upload_generated_outputs", side_effect=lambda audio, subtitle: (audio, subtitle)),
            patch("app.routes.clean_old_outputs"),
            patch("app.routes.get_last_match_result", return_value=None),
        ):
            response = client.post(
                "/api/generate/images",
                data={
                    "category": "美妆",
                    "title": "面霜",
                    "duration": "30",
                    "platform": "抖音",
                    "tone": "简洁",
                    "language": "zh",
                    "voice": "",
                },
                files=[("images", ("front.png", b"image-bytes", "image/png"))],
            )

        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["image_keywords"], ["补水", "锁水"])
        self.assertEqual(body["input"]["selling_points"], ["补水", "锁水"])
