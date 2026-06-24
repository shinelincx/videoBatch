import os
import sys
import unittest
from unittest.mock import AsyncMock, Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import verify_token
from app.models import MarketingCopy, TokenUsage


class TestCopyOnlyApi(unittest.TestCase):
    def _client(self):
        from app.routes import router

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[verify_token] = lambda: "test"
        return TestClient(app)

    def test_v2_generate_copy_returns_copy_and_usage_without_media(self):
        client = self._client()
        copy = MarketingCopy(
            title="夏季防蚊裤",
            tags=["#童装", "#夏季好物"],
            text="这条裤子夏天穿很凉快。",
            word_count=12,
            estimated_duration=3.0,
        )
        usage = TokenUsage(prompt_tokens=100, completion_tokens=20, total_tokens=120, attempts=1, model="gpt-4o-mini")

        with (
            patch("app.routes.generate_copy_with_usage", new=AsyncMock(return_value=(copy, usage))),
            patch("app.routes.text_to_speech") as tts,
            patch("app.routes.generate_srt") as srt,
            patch("app.routes.upload_generated_outputs") as upload,
            patch("app.routes.get_last_match_result", return_value=None),
        ):
            response = client.post(
                "/api/v2/generate-copy",
                json={
                    "category": "服饰",
                    "title": "儿童夏季速干防蚊裤",
                    "selling_points": ["凉快", "防蚊", "宽松", "速干"],
                    "duration": 30,
                    "platform": "抖音",
                    "language": "zh",
                    "tags": ["童装", "夏季"],
                },
            )

        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["input"]["category"], "服饰")
        self.assertNotIn("tone", body["input"])
        self.assertNotIn("voice", body["input"])
        self.assertEqual(body["marketing_copy"]["tags"], ["#童装", "#夏季好物"])
        self.assertEqual(body["token_usage"]["total_tokens"], 120)
        self.assertIsNone(body["image_keywords"])
        self.assertNotIn("audio", body)
        self.assertNotIn("subtitle", body)
        tts.assert_not_called()
        srt.assert_not_called()
        upload.assert_not_called()

    def test_v2_generate_copy_images_uses_image_keywords_without_media(self):
        client = self._client()
        copy = MarketingCopy(
            title="面霜",
            tags=["#补水"],
            text="这款面霜清爽不油腻。",
            word_count=11,
            estimated_duration=2.75,
        )
        usage = TokenUsage(prompt_tokens=80, completion_tokens=15, total_tokens=95, attempts=1, model="gpt-4o-mini")

        with (
            patch("app.routes.extract_image_keywords", new=AsyncMock(return_value=["补水", "锁水"])),
            patch("app.routes.generate_copy_with_usage", new=AsyncMock(return_value=(copy, usage))),
            patch("app.routes.text_to_speech") as tts,
            patch("app.routes.generate_srt") as srt,
            patch("app.routes.upload_generated_outputs") as upload,
            patch("app.routes.get_last_match_result", return_value=None),
        ):
            response = client.post(
                "/api/v2/generate-copy/images",
                data={
                    "category": "美妆",
                    "title": "面霜",
                    "duration": "30",
                    "platform": "抖音",
                    "language": "zh",
                },
                files=[("images", ("front.png", b"image-bytes", "image/png"))],
            )

        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["input"]["selling_points"], ["补水", "锁水"])
        self.assertEqual(body["image_keywords"], ["补水", "锁水"])
        self.assertNotIn("audio", body)
        self.assertNotIn("subtitle", body)
        tts.assert_not_called()
        srt.assert_not_called()
        upload.assert_not_called()

    def test_token_usage_is_extracted_from_message_metadata(self):
        from app.agent import _extract_token_usage

        message = Mock()
        message.usage_metadata = None
        message.response_metadata = {
            "token_usage": {
                "prompt_tokens": 7,
                "completion_tokens": 3,
                "total_tokens": 10,
            }
        }

        usage = _extract_token_usage(message, attempts=2)

        self.assertEqual(usage.prompt_tokens, 7)
        self.assertEqual(usage.completion_tokens, 3)
        self.assertEqual(usage.total_tokens, 10)
        self.assertEqual(usage.attempts, 2)

    def test_generate_copy_with_usage_accumulates_retry_tokens(self):
        import app.agent as agent
        from app.models import ProductInput

        class FakeMessage:
            def __init__(self, content, prompt_tokens, completion_tokens):
                self.content = content
                self.usage_metadata = {
                    "input_tokens": prompt_tokens,
                    "output_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens,
                }
                self.response_metadata = {}

        class FakeChain:
            def __init__(self):
                self.calls = 0

            def invoke(self, _payload):
                self.calls += 1
                if self.calls == 1:
                    return FakeMessage("【标题】短\n【标签】童装\n【正文】\n短", 10, 2)
                return FakeMessage(
                    (
                        "【标题】合适\n【标签】童装\n【正文】\n"
                        "这条儿童裤子夏天穿很凉快，面料柔软又速干，活动也方便。"
                        "宽松版型不勒肚子，上学户外都能穿，搭配短袖防晒衣也很省心。"
                    ),
                    20,
                    8,
                )

        product_input = ProductInput(
            category="服饰",
            title="儿童夏季速干防蚊裤",
            selling_points=["凉快", "速干", "宽松"],
            duration=15,
            platform="抖音",
            language="zh",
        )

        with (
            patch("app.agent._get_message_chain", return_value=FakeChain()),
            patch("app.agent.build_enhanced_prompt_params", return_value={
                "target_word_count": 85,
                "target_word_range": "76-93",
                "execution_steps": "",
                "quality_constraints": "",
                "reference_examples": "",
                "trend_insights": "暂无实时热门视频洞察",
                "category": "服饰",
                "title": "儿童夏季速干防蚊裤",
                "selling_points": "凉快, 速干, 宽松",
                "duration": 15,
                "platform": "抖音",
                "tone": "简洁",
                "language": "简体中文",
                "price_constraint": "## 价格约束\n不要出现任何价格。",
            }),
            patch("app.agent.asyncio.sleep", new=AsyncMock()),
        ):
            copy, usage = agent.asyncio.run(agent.generate_copy_with_usage(product_input))

        self.assertEqual(copy.tags, ["#童装"])
        self.assertEqual(usage.prompt_tokens, 30)
        self.assertEqual(usage.completion_tokens, 10)
        self.assertEqual(usage.total_tokens, 40)
        self.assertEqual(usage.attempts, 2)
