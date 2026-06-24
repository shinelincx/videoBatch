"""
字幕断句规则测试用例
覆盖：中/英/日/韩四种语言的句子级、子句级、短语级断句及回退策略
"""
import sys
import os
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.subtitle import generate_srt, _clean_wb_text, _clean_subtitle_text

_TICK = 10_000_000


def make_wb(words, start_offset=0, duration_per_word=_TICK // 3):
    """辅助函数：构建 word_boundaries 列表"""
    wb = []
    offset = start_offset
    for text in words:
        wb.append({"text": text, "offset": offset, "duration": duration_per_word})
        offset += duration_per_word
    return wb


def make_wb_long(words, durations):
    """辅助函数：构建带自定义时长的 word_boundaries 列表"""
    wb = []
    offset = 0
    for text, dur in zip(words, durations):
        wb.append({"text": text, "offset": offset, "duration": dur})
        offset += dur
    return wb


class TestChineseSubtitle(unittest.TestCase):
    """中文字幕断句测试"""

    def test_basic_sentence_break(self):
        """基本句子断点：遇到 。！？ 应当断开"""
        wb = make_wb(["大家好", "。", "今天", "天气", "不错", "。"])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        self.assertEqual(len(result.entries), 2)
        self.assertEqual(result.entries[0].text, "大家好。")
        self.assertEqual(result.entries[1].text, "今天天气不错。")

    def test_short_sentence_merged(self):
        """极短句子不单独断开，应与后续内容合并"""
        wb = make_wb(["嗯", "。", "好的", "。", "我知道了", "。"])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        texts = [e.text for e in result.entries]
        combined = "".join(texts)
        self.assertIn("嗯。", combined)
        self.assertIn("好的。", combined)
        self.assertIn("我知道了。", combined)

    def test_sentence_break_priority_over_phrase(self):
        """句子断点优先级高于短语断点：回退时优先选句子断点"""
        wb = make_wb([
            "今天", "天气", "不错", "，",
            "我们", "出去", "走", "走", "吧", "。",
            "但是", "明天", "可能", "会", "下雨", "。",
        ])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        texts = [e.text for e in result.entries]
        combined = "".join(texts)
        self.assertEqual(combined, "今天天气不错，我们出去走走吧。但是明天可能会下雨。")
        self.assertGreaterEqual(len(result.entries), 2)

    def test_clause_break(self):
        """子句标点 ；： 在内容足够时断开"""
        wb = make_wb([
            "产品", "特点", "如下", "：",
            "高效", "保湿", "持久", "锁水", "；",
            "轻薄", "不", "油腻", "快速", "吸收", "。",
        ])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        texts = [e.text for e in result.entries]
        combined = "".join(texts)
        self.assertIn("：", combined)
        self.assertIn("；", combined)
        self.assertGreaterEqual(len(result.entries), 2)

    def test_phrase_break_when_long(self):
        """短语标点 ， 在内容接近上限时断开"""
        wb = make_wb([
            "这款", "产品", "不仅", "保湿", "效果", "好", "，",
            "而且", "价格", "也", "非常", "实惠", "，",
            "值得", "入手", "。",
        ])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        for entry in result.entries:
            self.assertLessEqual(len(entry.text), 33)

    def test_hard_limit_no_punctuation(self):
        """无标点的长文本：按硬上限截断"""
        wb = make_wb([
            "这个", "产品", "真的", "非常", "好用",
            "大家", "一定", "要买", "强烈", "推荐",
            "给", "所有", "的", "朋友", "们",
        ])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        self.assertGreaterEqual(len(result.entries), 1)
        for entry in result.entries:
            self.assertLessEqual(len(entry.text), 33)

    def test_single_entry(self):
        """单条短文本"""
        wb = make_wb(["你好", "。"])

        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        self.assertEqual(len(result.entries), 1)
        self.assertEqual(result.entries[0].text, "你好。")

    def test_empty_input(self):
        """空输入"""
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt([], f.name, "zh")
            os.unlink(f.name)

        self.assertEqual(len(result.entries), 0)

    def test_exclamation_and_question(self):
        """感叹号和问号作为句子断点"""
        wb = make_wb(["太棒了", "！", "真的吗", "？", "我", "不信", "。"])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        texts = [e.text for e in result.entries]
        combined = "".join(texts)
        self.assertIn("！", combined)
        self.assertIn("？", combined)
        self.assertIn("。", combined)

    def test_duration_limit(self):
        """时长超过 5 秒时截断"""
        long_dur = 6 * _TICK
        short_dur = _TICK // 5
        wb = make_wb_long(
            ["第一", "句话", "。"],
            [short_dur, short_dur, short_dur],
        )
        wb2 = make_wb_long(
            ["第", "二", "句", "话", "。"],
            [long_dur, short_dur, short_dur, short_dur, short_dur],
        )
        wb = wb + wb2

        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        self.assertGreaterEqual(len(result.entries), 2)


class TestEnglishSubtitle(unittest.TestCase):
    """英文字幕断句测试"""

    def test_basic_sentence_break(self):
        """基本句子断点"""
        wb = make_wb(["Hello", " world", ". ", "This", " is", " great", "."])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "en")
            os.unlink(f.name)

        self.assertGreaterEqual(len(result.entries), 2)

    def test_comma_break_when_long(self):
        """逗号断点：内容长时断开"""
        words = ["This", " is", " a", " very", " long", " sentence", ",",
                 " and", " it", " keeps", " going", " on", " and", " on", ",",
                 " until", " it", " finally", " ends", "."]
        wb = make_wb(words)

        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "en")
            os.unlink(f.name)

        for entry in result.entries:
            self.assertLessEqual(len(entry.text), 120)


class TestJapaneseSubtitle(unittest.TestCase):
    """日文字幕断句测试"""

    def test_basic_sentence_break(self):
        """日语句子断点"""
        wb = make_wb(["こんにちは", "。", "今日", "は", "いい", "天気", "です", "。"])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "ja")
            os.unlink(f.name)

        self.assertGreaterEqual(len(result.entries), 2)

    def test_japanese_phrase_breaks(self):
        """日文短语断点 、"""
        words = ["それ", "では", "、", "本日", "の", "会議", "を", "始め", "ます", "。"]
        wb = make_wb(words)
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "ja")
            os.unlink(f.name)

        self.assertGreaterEqual(len(result.entries), 1)


class TestKoreanSubtitle(unittest.TestCase):
    """韩文字幕断句测试"""

    def test_basic_sentence_break(self):
        """韩文句子断点"""
        wb = make_wb(["안녕하세요", ". ", "오늘", "은", "날씨", "가", "좋습니다", "."])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "ko")
            os.unlink(f.name)

        self.assertGreaterEqual(len(result.entries), 2)


class TestSRTFormat(unittest.TestCase):
    """SRT 格式输出测试"""

    def test_srt_file_contains_entries(self):
        """验证 SRT 文件格式正确"""
        wb = make_wb(["你好", "。", "世界", "。"])
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            path = f.name
            f.close()

        result = generate_srt(wb, path, "zh")

        self.assertEqual(result.srt_file_path, path)
        self.assertGreaterEqual(len(result.entries), 1)

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("-->", content)
        for entry in result.entries:
            self.assertIn(str(entry.index), content)
            self.assertIn(entry.text, content)

        os.unlink(path)


class TestTextCleaning(unittest.TestCase):
    """文本清理测试"""

    def test_emoji_filtered_from_wb(self):
        """emoji 在 word boundary 清理时被移除"""
        self.assertEqual(_clean_wb_text("🔥"), "")
        self.assertEqual(_clean_wb_text("Hello🔥"), "Hello")
        self.assertEqual(_clean_wb_text("🔥World"), "World")
        self.assertEqual(_clean_wb_text("go🚀"), "go")

    def test_emoji_filtered_from_subtitle(self):
        """emoji 在最终字幕清理时被移除"""
        self.assertEqual(_clean_subtitle_text("🔥Crazy"), "Crazy")
        self.assertEqual(_clean_subtitle_text("Hello 🔥 World"), "Hello World")
        self.assertEqual(_clean_subtitle_text("💥"), "")

    def test_fullwidth_chars_stripped(self):
        """全角干扰字符 ＞ ＂ ＇ ％ 在清理时被剥离"""
        self.assertEqual(_clean_wb_text("＞家人们"), "家人们")
        self.assertEqual(_clean_wb_text("＂test"), "test")
        self.assertEqual(_clean_wb_text("％100"), "100")
        self.assertEqual(_clean_subtitle_text("＞家人们！"), "家人们！")
        self.assertEqual(_clean_subtitle_text("＂text＂"), "text")

    def test_fullwidth_legitimate_kept(self):
        """全角合法标点 ！？。 不被剥离"""
        self.assertEqual(_clean_wb_text("！"), "！")
        self.assertEqual(_clean_wb_text("？"), "？")
        self.assertEqual(_clean_wb_text("。"), "。")

    def test_xml_tags_removed(self):
        """XML/SSML 标签被移除"""
        self.assertEqual(_clean_wb_text("<prosody>hello</prosody>"), "hello")


class TestTimeOverlap(unittest.TestCase):
    """时间重叠修复测试"""

    def test_no_overlap_consecutive_entries(self):
        """相邻字幕条目时间不重叠"""
        wb = make_wb(["家人们", "！", "这产品", "绝了", "！"], start_offset=1000000)
        # 手动制造重叠：让第三个词的 offset 早于第二个词结束
        wb[2]["offset"] = wb[1]["offset"] + wb[1]["duration"] - 500000

        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        self.assertGreaterEqual(len(result.entries), 1)
        for i in range(1, len(result.entries)):
            prev_end = result.entries[i - 1].end_time
            curr_start = result.entries[i].start_time
            self.assertGreaterEqual(curr_start, prev_end,
                f"Entry {i} start={curr_start} < prev end={prev_end}")

    def test_overlap_adjustment(self):
        """当 word boundary 时间重叠时，开始时间被调整为上一条结束时间"""
        dur = _TICK // 3
        wb = [
            {"text": "第一句话", "offset": 0, "duration": dur},
            {"text": "。", "offset": dur, "duration": dur // 5},
            {"text": "第二句话", "offset": dur + dur // 5 - 100000, "duration": dur},
        ]
        with tempfile.NamedTemporaryFile(suffix=".srt", mode="w", delete=False, encoding="utf-8") as f:
            f.close()
            result = generate_srt(wb, f.name, "zh")
            os.unlink(f.name)

        for i in range(1, len(result.entries)):
            prev_end = result.entries[i - 1].end_time
            curr_start = result.entries[i].start_time
            self.assertGreaterEqual(curr_start, prev_end,
                f"Entry {i} overlaps with previous")


if __name__ == "__main__":
    unittest.main(verbosity=2)
