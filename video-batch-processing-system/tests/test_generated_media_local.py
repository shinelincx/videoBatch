import pytest

from video_batch import generated_speech
from video_batch.generated_speech import clean_for_speech, expand_abbreviations
from video_batch.generated_subtitle import generate_srt, ticks_to_srt_time


def test_ticks_to_srt_time_formats_milliseconds():
    assert ticks_to_srt_time(12_345_000) == "00:00:01,234"


def test_generate_srt_writes_entries_from_boundaries(tmp_path):
    output = tmp_path / "subtitle.srt"

    entries = generate_srt(
        [
            {"text": "hello ", "offset": 0, "duration": 5_000_000},
            {"text": "world!", "offset": 5_000_000, "duration": 5_000_000},
        ],
        output,
        "en",
    )

    assert len(entries) == 1
    assert entries[0].start_time == "00:00:00,000"
    assert entries[0].end_time == "00:00:01,000"
    assert "hello world!" in output.read_text(encoding="utf-8")


def test_generate_srt_writes_empty_file_for_empty_boundaries(tmp_path):
    output = tmp_path / "empty.srt"

    entries = generate_srt([], output, "zh")

    assert entries == []
    assert output.exists()
    assert output.read_text(encoding="utf-8") == ""


def test_generate_srt_splits_chinese_boundary_by_sentence_punctuation(tmp_path):
    output = tmp_path / "zh-sentences.srt"

    entries = generate_srt(
        [
            {
                "text": "第一句介绍商品。第二句说明卖点！第三句提醒下单？",
                "offset": 0,
                "duration": 9_000_000,
            },
        ],
        output,
        "zh",
    )

    assert [entry.text for entry in entries] == [
        "第一句介绍商品。",
        "第二句说明卖点！",
        "第三句提醒下单？",
    ]
    assert entries[0].start_time == "00:00:00,000"
    assert entries[-1].end_time == "00:00:00,900"


def test_generate_srt_splits_long_chinese_sentence_inside_boundary(tmp_path):
    output = tmp_path / "zh-long.srt"
    text = "这是一段没有标点但是明显超过单条字幕长度限制的中文商品介绍内容"

    entries = generate_srt(
        [{"text": text, "offset": 10_000_000, "duration": 20_000_000}],
        output,
        "zh",
    )

    assert len(entries) > 1
    assert all(len(entry.text) <= 22 for entry in entries)
    assert entries[0].start_time == "00:00:01,000"
    assert entries[-1].end_time == "00:00:03,000"


def test_generate_srt_keeps_split_entries_inside_original_boundary(tmp_path):
    output = tmp_path / "zh-sync.srt"

    entries = generate_srt(
        [
            {
                "text": "第一句需要显示。第二句也要显示。",
                "offset": 30_000_000,
                "duration": 30_000_000,
            },
        ],
        output,
        "zh",
    )

    assert entries[0].start_time == "00:00:03,000"
    assert entries[-1].end_time == "00:00:06,000"
    assert entries[0].end_time == entries[1].start_time


def test_clean_for_speech_removes_unreadable_characters():
    assert clean_for_speech("A😀  B") == "A B"


def test_expand_abbreviations_makes_common_terms_tts_friendly():
    assert expand_abbreviations("API ROI") == "A P I return on investment"


def test_load_tts_dependencies_reports_missing_package(monkeypatch):
    real_import = __import__

    def fake_import(name, *args, **kwargs):
        if name == "aiohttp":
            raise ModuleNotFoundError("No module named 'aiohttp'", name="aiohttp")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr("builtins.__import__", fake_import)

    with pytest.raises(Exception) as exc_info:
        generated_speech._load_tts_dependencies()

    assert exc_info.type.__name__ == "TtsDependencyError"
    assert "aiohttp" in str(exc_info.value)
    assert "requirements.txt" in str(exc_info.value)
