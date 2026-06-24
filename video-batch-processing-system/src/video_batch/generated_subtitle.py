"""Generate local SRT subtitles from TTS timing boundaries."""

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SubtitleEntry:
    index: int
    start_time: str
    end_time: str
    text: str


_MAX_CHARS = {
    "zh": 22,
    "en": 80,
    "ja": 22,
    "ko": 25,
    "th": 40,
    "vi": 80,
    "id": 80,
    "ms": 80,
    "fil": 80,
    "my": 30,
    "km": 30,
    "lo": 40,
}

_SENTENCE_BREAKS = {
    "zh": "。！？；\n",
    "en": ".!?\n",
    "ja": "。！？\n",
    "ko": ".!?\n",
}

_CJK_LANGUAGES = {"zh", "ja", "ko"}
_CJK_SPLIT_RE = re.compile(r"[^。！？；，、!?;,\n]+[。！？；，、!?;,\n]*")

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

_STRIP_CHARS = '%"\'> #'
_MAX_DURATION_SEC = 5.0


def generate_srt(
    word_boundaries: list[dict],
    output_path: Path,
    language: str = "zh",
) -> list[SubtitleEntry]:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    clean_boundaries = []
    for wb in word_boundaries or []:
        text = _clean_boundary_text(str(wb.get("text", "")))
        if text:
            clean_boundaries.append({
                "text": text,
                "offset": int(wb.get("offset", 0)),
                "duration": int(wb.get("duration", 0)),
            })

    if not clean_boundaries:
        output_path.write_text("", encoding="utf-8")
        return []

    display_boundaries = _split_boundaries_for_display(clean_boundaries, language)
    entries = _group_entries(display_boundaries, language)
    _write_srt(entries, output_path)
    return entries


def _split_boundaries_for_display(boundaries: list[dict], language: str) -> list[dict]:
    if language not in _CJK_LANGUAGES:
        return boundaries

    max_chars = _MAX_CHARS.get(language, _MAX_CHARS["zh"])
    display_boundaries: list[dict] = []
    for boundary in boundaries:
        parts = _split_cjk_text(boundary["text"], max_chars)
        if not parts:
            continue

        start_ticks = int(boundary.get("offset", 0))
        duration_ticks = max(0, int(boundary.get("duration", 0)))
        end_ticks = start_ticks + duration_ticks
        weights = [max(_display_len(part), 1) for part in parts]
        cursor = start_ticks

        for index, part in enumerate(parts):
            if index == len(parts) - 1:
                part_end = end_ticks
            else:
                remaining_ticks = max(0, end_ticks - cursor)
                remaining_weight = max(sum(weights[index:]), 1)
                span = int(round(remaining_ticks * weights[index] / remaining_weight))
                if remaining_ticks > 0:
                    span = max(1, min(span, remaining_ticks))
                part_end = cursor + span

            display_boundaries.append({
                "text": part,
                "offset": cursor,
                "duration": max(0, part_end - cursor),
                "force_break": True,
            })
            cursor = part_end
    return display_boundaries


def _split_cjk_text(text: str, max_chars: int) -> list[str]:
    raw_parts = _CJK_SPLIT_RE.findall(text) or [text]
    parts: list[str] = []
    for raw_part in raw_parts:
        part = _clean_subtitle_text(raw_part)
        if not part:
            continue
        while len(part) > max_chars:
            parts.append(part[:max_chars])
            part = part[max_chars:]
        if part:
            parts.append(part)
    return parts


def _display_len(text: str) -> int:
    return len(_clean_subtitle_text(text))


def _group_entries(boundaries: list[dict], language: str) -> list[SubtitleEntry]:
    max_chars = _MAX_CHARS.get(language, _MAX_CHARS["zh"])
    sentence_breaks = _SENTENCE_BREAKS.get(language, _SENTENCE_BREAKS["en"])
    entries: list[SubtitleEntry] = []
    i = 0
    prev_end_ticks = -1
    while i < len(boundaries):
        group = [boundaries[i]]
        acc_text = boundaries[i]["text"]
        j = i + 1
        while j < len(boundaries):
            if group[-1].get("force_break"):
                break
            candidate = acc_text + boundaries[j]["text"]
            duration_sec = (
                boundaries[j]["offset"]
                + boundaries[j]["duration"]
                - group[0]["offset"]
            ) / 10_000_000
            if len(candidate) > max_chars or duration_sec > _MAX_DURATION_SEC:
                break
            group.append(boundaries[j])
            acc_text = candidate
            j += 1
            if acc_text.rstrip()[-1:] in sentence_breaks and len(acc_text) >= 3:
                break

        start_ticks = group[0]["offset"]
        end_ticks = group[-1]["offset"] + group[-1]["duration"]
        if prev_end_ticks >= 0 and start_ticks < prev_end_ticks:
            start_ticks = prev_end_ticks
        text = _clean_subtitle_text("".join(item["text"] for item in group))
        if text:
            entries.append(SubtitleEntry(
                index=len(entries) + 1,
                start_time=ticks_to_srt_time(start_ticks),
                end_time=ticks_to_srt_time(end_ticks),
                text=text,
            ))
            prev_end_ticks = max(prev_end_ticks, end_ticks)
        i = j
    return entries


def ticks_to_srt_time(ticks: int) -> str:
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


def _write_srt(entries: list[SubtitleEntry], output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as f:
        for entry in entries:
            f.write(f"{entry.index}\n")
            f.write(f"{entry.start_time} --> {entry.end_time}\n")
            f.write(f"{entry.text}\n\n")


def _clean_boundary_text(text: str) -> str:
    text = re.sub(r"<[^>]*>", "", text)
    text = _SPEECH_SAFE_PATTERN.sub("", text)
    return text.lstrip(_STRIP_CHARS)


def _clean_subtitle_text(text: str) -> str:
    text = re.sub(r"<[^>]*>", "", text)
    text = _SPEECH_SAFE_PATTERN.sub("", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(_STRIP_CHARS).strip()
