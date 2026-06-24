import re

from app.models import SubtitleEntry, SubtitleOutput

# 各语种句子级断句标点（遇到后优先在此断开）
_SENTENCE_BREAKS = {
    "zh": "。！？\n",
    "en": ".!?\n",
    "ja": "。！？\n",
    "ko": ".!?\n",
    "th": " \n",
    "vi": ".!?\n",
    "id": ".!?\n",
    "ms": ".!?\n",
    "fil": ".!?\n",
    "my": "။\n",
    "km": "។៕\n",
    "lo": " \n",
}

# 各语种子句级断句标点（次级优先断开位置）
_CLAUSE_BREAKS = {
    "zh": "；：",
    "en": ";:",
    "ja": "；：",
    "ko": ";:",
    "th": "",
    "vi": ";:",
    "id": ";:",
    "ms": ";:",
    "fil": ";:",
    "my": "၊",
    "km": " ",
    "lo": "",
}

# 各语种短语级断句标点（三级优先断开位置）
_PHRASE_BREAKS = {
    "zh": "，、…",
    "en": ",…",
    "ja": "、，…",
    "ko": ",…",
    "th": "",
    "vi": ",…",
    "id": ",…",
    "ms": ",…",
    "fil": ",…",
    "my": "",
    "km": "",
    "lo": "",
}

# 各语种字幕建议最大字符数（超过后优先在语义断点处切断）
_MAX_CHARS = {
    "zh": 22, "en": 80, "ja": 22, "ko": 25,
    "th": 40, "vi": 80, "id": 80, "ms": 80,
    "fil": 80, "my": 30, "km": 30, "lo": 40,
}

# 单条字幕最大时长（秒）
_MAX_DURATION_SEC = 5.0

# emoji / 不可见字符过滤模式（与 tts.py 保持一致，保留各语种文字与标点）
_SPEECH_SAFE_PATTERN = re.compile(
    "[^"
    "\u0020-\u007E"
    "\u00A0-\u00FF"
    "\u0E00-\u0E7F"
    "\u0E80-\u0EFF"
    "\u1000-\u109F"
    "\u1780-\u17FF"
    "\u2000-\u206F"
    "\u2100-\u214F"
    "\u3000-\u303F"
    "\u3040-\u309F"
    "\u30A0-\u30FF"
    "\u3400-\u4DBF"
    "\u4E00-\u9FFF"
    "\uAC00-\uD7AF"
    "\uFF00-\uFFEF"
    "]",
    re.UNICODE,
)

# 需要从词边界首尾剥离的干扰字符（含半角/全角对应）
_STRIP_CHARS = '%"\'> ％＂＇＞＜　'

# 根据语种获取三种断句标点集合
def _get_break_chars(language: str):
    return (
        _SENTENCE_BREAKS.get(language, _SENTENCE_BREAKS["zh"]),
        _CLAUSE_BREAKS.get(language, _CLAUSE_BREAKS["zh"]),
        _PHRASE_BREAKS.get(language, _PHRASE_BREAKS["zh"]),
    )


def _ticks_to_srt_time(ticks: int) -> str:
    total_seconds = ticks / 10_000_000
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    seconds = int(total_seconds % 60)
    milliseconds = int(round((total_seconds - int(total_seconds)) * 1000))
    if milliseconds == 1000:
        milliseconds = 0
        seconds += 1
        if seconds == 60:
            seconds = 0
            minutes += 1
            if minutes == 60:
                minutes = 0
                hours += 1
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"


def _clean_wb_text(text: str) -> str:
    """清理单个词边界文本：移除 emoji、SSML/XML 标签、引号前缀等杂质"""
    text = re.sub(r"<[^>]*>", "", text)
    text = _SPEECH_SAFE_PATTERN.sub("", text)
    text = text.lstrip(_STRIP_CHARS)
    return text


def _clean_subtitle_text(text: str) -> str:
    """清理最终字幕文本：移除 emoji、SSML 标签、多余空白及干扰字符"""
    text = re.sub(r"<[^>]*>", "", text)
    text = _SPEECH_SAFE_PATTERN.sub("", text)
    text = re.sub(r"\s+", " ", text)
    text = text.lstrip(_STRIP_CHARS).rstrip(_STRIP_CHARS)
    return text.strip()


def generate_srt(word_boundaries: list, output_path: str, language: str = "zh") -> SubtitleOutput:
    """
    基于 edge-tts 返回的 word_boundaries 生成 SRT 字幕。

    断句策略（按语种语义规则，三级优先级）：
      一级 —— 句子结束标点（。！？/.!?）：优先在此断开，仅当极短时合并
      二级 —— 子句标点（；：/;:）：内容足够长时在此断开
      三级 —— 短语标点（，、…/,…）：内容接近上限时在此断开
      兜底 —— 超过字符硬上限时强制截断，回退至最近的语义断点
      回退优先级：句子断点 > 子句断点 > 短语断点
    """
    sentence_breaks, clause_breaks, phrase_breaks = _get_break_chars(language)
    max_chars = _MAX_CHARS.get(language, 22)
    min_sentence_chars = max(max_chars * 0.15, 3)

    # 预处理：清洗每个词边界的杂质文本
    clean_wb = []
    for wb in word_boundaries:
        cleaned = _clean_wb_text(wb["text"])
        if cleaned:
            clean_wb.append({"text": cleaned, "offset": wb["offset"], "duration": wb["duration"]})
    if not clean_wb:
        return SubtitleOutput(srt_file_path=output_path, entries=[])

    entries = []
    i = 0
    prev_end_ticks = -1
    while i < len(clean_wb):
        group = [clean_wb[i]]
        acc_text = clean_wb[i]["text"]
        acc_dur = clean_wb[i]["duration"]
        last_sentence_idx = -1
        last_clause_idx = -1
        last_phrase_idx = -1
        sentence_text_len = 0
        clause_text_len = 0
        phrase_text_len = 0

        j = i + 1
        while j < len(clean_wb):
            nxt = clean_wb[j]
            new_text = acc_text + nxt["text"]
            new_dur = acc_dur + nxt["duration"]

            # 超过硬上限时强制截断
            if len(new_text) > max_chars * 1.5:
                break
            if (new_dur / 10_000_000) > _MAX_DURATION_SEC:
                break

            group.append(nxt)
            acc_text = new_text
            acc_dur = new_dur

            # 一级：句子结束标点（对尾部空格做兼容处理）
            if acc_text and acc_text.rstrip()[-1] in sentence_breaks:
                last_sentence_idx = len(group) - 1
                sentence_text_len = len(acc_text)
                if len(acc_text) >= min_sentence_chars:
                    j += 1
                    break
            # 二级：子句标点
            elif acc_text and acc_text.rstrip()[-1] in clause_breaks:
                last_clause_idx = len(group) - 1
                clause_text_len = len(acc_text)
                if len(acc_text) >= max_chars * 0.6:
                    j += 1
                    break
            # 三级：短语标点
            elif acc_text and acc_text.rstrip()[-1] in phrase_breaks:
                last_phrase_idx = len(group) - 1
                phrase_text_len = len(acc_text)
                if len(acc_text) >= max_chars * 0.7:
                    j += 1
                    break

            j += 1

        # 回退策略：按优先级选择最佳语义断点
        best_break = -1
        if last_sentence_idx >= 0 and sentence_text_len >= min_sentence_chars:
            best_break = last_sentence_idx
        elif last_clause_idx >= 0 and clause_text_len >= max_chars * 0.3:
            best_break = last_clause_idx
        elif last_phrase_idx >= 0 and phrase_text_len >= max_chars * 0.3:
            best_break = last_phrase_idx

        if best_break >= 0 and len(group) > best_break + 1:
            keep = best_break + 1
            group = clean_wb[i : i + keep]
            j = i + keep

        start_ticks = group[0]["offset"]
        end_ticks = group[-1]["offset"] + group[-1]["duration"]

        # 修复 TTS word boundary 时间重叠：确保开始不早于上一条结束
        if prev_end_ticks >= 0 and start_ticks < prev_end_ticks:
            start_ticks = prev_end_ticks

        entry_text = _clean_subtitle_text("".join(wb["text"] for wb in group))

        if entry_text:
            entries.append(SubtitleEntry(
                index=len(entries) + 1,
                start_time=_ticks_to_srt_time(start_ticks),
                end_time=_ticks_to_srt_time(end_ticks),
                text=entry_text,
            ))
            prev_end_ticks = max(prev_end_ticks, end_ticks)
        i = j

    with open(output_path, "w", encoding="utf-8") as f:
        for entry in entries:
            f.write(f"{entry.index}\n")
            f.write(f"{entry.start_time} --> {entry.end_time}\n")
            f.write(f"{entry.text}\n\n")

    return SubtitleOutput(srt_file_path=output_path, entries=entries)
