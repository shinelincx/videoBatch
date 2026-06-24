import os
import sys
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import verify_token
from app.models import ProductInput


SAMPLE_DOUYIN_VIDEO = {
    "采集日期": "2026-06-15",
    "类目": "服装",
    "视频标题": "男女孩花色都有，这也太凉快了～#儿童裤子 #kk树",
    "视频时长": "1分22秒",
    "发布时间": "2026/05/30 18:10:22",
    "总播放量": "70万+",
    "结算金额": "10万-50万",
    "总点赞量": "600+",
    "带货文案标题": "男女孩花色都有，这也太凉快了～#儿童裤子 #kk树",
    "语音转文字": (
        "KK是在清一批7年的老款，就这件超凉快像开了小风扇一样的小裤子。"
        "这个留着夏天来穿也太凉快了，侧面拼接透气网面，穿起来格外凉快。"
        "面料吸湿又速干，宽宽松松方便孩子活动，裤脚弹力束脚还能防蚊虫。"
        "很适合上学的孩子来穿，胖宝瘦宝都可以放心来穿。"
        "库存不太多了，刷到有合适能穿的话一定得多薅两条。"
    ),
    "话题内容": "#儿童裤子 #kk树",
    "采集时间": "2026-06-15 19:36:04",
}


class TestTrendParsingAndNormalization(unittest.TestCase):
    def test_parse_douyin_numbers_and_duration(self):
        from app.trends import parse_count, parse_money_range, parse_duration_seconds

        self.assertEqual(parse_count("70万+"), 700000)
        self.assertEqual(parse_count("600+"), 600)
        self.assertEqual(parse_money_range("10万-50万"), (100000, 500000))
        self.assertEqual(parse_duration_seconds("1分22秒"), 82)

    def test_normalizer_extracts_category_and_search_signals(self):
        from app.trends import TrendNormalizer

        normalized = TrendNormalizer().normalize(SAMPLE_DOUYIN_VIDEO)

        self.assertEqual(normalized["raw_category"], "服装")
        self.assertEqual(normalized["normalized_category"], "服饰")
        self.assertIn("儿童裤子", normalized["product_keywords"])
        self.assertIn("儿童", normalized["audience"])
        self.assertIn("夏季", normalized["season"])
        self.assertIn("上学", normalized["scenario"])
        self.assertIn("凉快", normalized["selling_point_keywords"])
        self.assertIn("防蚊", normalized["selling_point_keywords"])
        self.assertIn("库存少", normalized["conversion_keywords"])


class TestTrendStoreAndRetrieval(unittest.TestCase):
    def test_ingestor_upserts_duplicate_video_by_source_hash(self):
        from app.trends import TrendIngestor, TrendStore

        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "trends.sqlite3")
            ingestor = TrendIngestor(db_path=db_path)

            first = ingestor.ingest_douyin([SAMPLE_DOUYIN_VIDEO])
            second = ingestor.ingest_douyin([SAMPLE_DOUYIN_VIDEO])
            rows = TrendStore(db_path).list_all()

            self.assertEqual(first, {"inserted": 1, "updated": 0, "skipped": 0})
            self.assertEqual(second, {"inserted": 0, "updated": 1, "skipped": 0})
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["play_count"], 700000)
            self.assertEqual(rows[0]["video_duration_seconds"], 82)

    def test_retriever_matches_when_input_category_differs_from_raw_category(self):
        from app.trends import TrendIngestor, TrendRetriever

        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "trends.sqlite3")
            TrendIngestor(db_path=db_path).ingest_douyin([SAMPLE_DOUYIN_VIDEO])
            product_input = ProductInput(
                category="母婴",
                title="儿童夏季速干防蚊裤",
                selling_points=["凉快", "防蚊", "宽松", "速干"],
                platform="抖音",
                duration=30,
            )

            matches = TrendRetriever(db_path=db_path, top_k=3).retrieve(product_input)
            insights = TrendRetriever(db_path=db_path, top_k=3).format_insights(matches)

            self.assertEqual(len(matches), 1)
            self.assertGreater(matches[0]["match_score"], 0.5)
            self.assertIn("匹配原因", insights)
            self.assertIn("儿童夏季裤装", insights)
            self.assertIn("凉快、速干、防蚊、宽松", insights)
            self.assertIn("禁止照搬", insights)


class TestTrendPromptAndRoute(unittest.TestCase):
    def test_prompt_params_include_trend_insights_when_enabled(self):
        from app.prompts import build_enhanced_prompt_params
        from app.trends import TrendIngestor

        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "trends.sqlite3")
            TrendIngestor(db_path=db_path).ingest_douyin([SAMPLE_DOUYIN_VIDEO])
            product_input = ProductInput(
                category="母婴",
                title="儿童夏季速干防蚊裤",
                selling_points=["凉快", "防蚊", "宽松", "速干"],
                platform="抖音",
                duration=30,
            )

            with (
                patch("app.prompts.ENABLE_TREND_KNOWLEDGE", True),
                patch("app.prompts.TREND_DB_PATH", db_path),
                patch("app.prompts.MAX_TREND_REFS", 3),
            ):
                params = build_enhanced_prompt_params(product_input)

            self.assertIn("实时热门视频洞察", params["trend_insights"])
            self.assertIn("儿童夏季裤装", params["trend_insights"])

    def test_agent_formats_prompt_with_trend_insights_block(self):
        from app.agent import _format_enhanced_prompt
        from app.skills.definitions.douyin import DOUYIN_FASHION_SKILL

        params = {
            "execution_steps": "Step 1 - 视觉种草：开头",
            "quality_constraints": "- 结尾含 CTA",
            "reference_examples": "示例1：参考文案",
            "trend_insights": "## 实时热门视频洞察\n热门视频1：\n匹配原因：同属儿童夏季裤装。",
            "category": "服饰",
            "title": "儿童夏季速干防蚊裤",
            "selling_points": "凉快, 防蚊",
            "language": "简体中文",
            "target_word_range": "108-132",
            "duration": 30,
            "price_constraint": "## 价格约束\n不要出现任何价格。",
        }

        prompt = _format_enhanced_prompt(DOUYIN_FASHION_SKILL, params)

        self.assertIn("## 实时热门视频洞察", prompt)
        self.assertIn("热门视频1", prompt)
        self.assertIn("不要照搬原文", prompt)

    def test_douyin_trend_ingest_route_accepts_batched_payload(self):
        from app.routes import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[verify_token] = lambda: "test"
        client = TestClient(app)

        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "trends.sqlite3")
            with (
                patch("app.routes.TREND_API_TOKEN", "secret-token"),
                patch("app.routes.TREND_DB_PATH", db_path),
            ):
                response = client.post(
                    "/api/trends/douyin/videos",
                    json={"items": [SAMPLE_DOUYIN_VIDEO]},
                    headers={"Authorization": "Bearer secret-token"},
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"inserted": 1, "updated": 0, "skipped": 0})

    def test_douyin_trend_ingest_route_rejects_invalid_token(self):
        from app.routes import router
        from fastapi import FastAPI

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[verify_token] = lambda: "test"
        client = TestClient(app)

        with patch("app.routes.TREND_API_TOKEN", "secret-token"):
            response = client.post(
                "/api/trends/douyin/videos",
                json={"items": [SAMPLE_DOUYIN_VIDEO]},
                headers={"Authorization": "Bearer wrong-token"},
            )

        self.assertEqual(response.status_code, 401)
