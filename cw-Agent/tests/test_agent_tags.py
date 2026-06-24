import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestMarketingCopyTags(unittest.TestCase):
    def test_douyin_tags_are_prefixed_with_hash(self):
        from app.agent import _build_marketing_copy
        from app.skills.definitions.douyin import DOUYIN_FASHION_SKILL

        copy = _build_marketing_copy(
            "这是一段抖音文案",
            "zh",
            DOUYIN_FASHION_SKILL,
            title="标题",
            tags=["童装", "#防蚊裤", "夏季好物"],
        )

        self.assertEqual(copy.tags, ["#童装", "#防蚊裤", "#夏季好物"])

    def test_non_douyin_tags_are_not_prefixed(self):
        from app.agent import _build_marketing_copy
        from app.skills.definitions.taobao import TAOBAO_DETAIL_SKILL

        copy = _build_marketing_copy(
            "这是一段淘宝文案",
            "zh",
            TAOBAO_DETAIL_SKILL,
            title="标题",
            tags=["详情页", "护肤"],
        )

        self.assertEqual(copy.tags, ["详情页", "护肤"])
