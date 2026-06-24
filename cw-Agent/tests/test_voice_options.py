import os
import sys
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routes import router


class TestVoiceOptionsRoute(unittest.TestCase):
    def _client(self):
        app = FastAPI()
        app.include_router(router)
        return TestClient(app)

    def test_voice_options_are_public_when_auth_enabled(self):
        client = self._client()

        with patch("app.auth.AUTH_ENABLED", True):
            response = client.get("/api/voices/zh")

        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(body["voices"]), 0)
        self.assertEqual(body["default"], "zh-CN-XiaoxiaoNeural")

    def test_generate_still_requires_auth_when_auth_enabled(self):
        client = self._client()

        with patch("app.auth.AUTH_ENABLED", True):
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

        self.assertEqual(response.status_code, 401)


class TestVoiceOptionsFrontend(unittest.TestCase):
    def test_app_js_has_fallback_voice_rendering(self):
        app_js_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "app.js")

        with open(app_js_path, "r", encoding="utf-8") as f:
            app_js = f.read()

        self.assertIn("renderFallbackVoice", app_js)
        self.assertIn("zh-CN-XiaoxiaoNeural", app_js)
        self.assertIn(".catch(function (error)", app_js)
