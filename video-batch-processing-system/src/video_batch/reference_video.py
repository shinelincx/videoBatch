"""参考视频处理器 - 对原视频应用视频效果和音频处理。

ReferenceVideoProcessor 类负责参考生视频流程：
  - 对参考视频应用视频效果滤镜链（抽帧、裁剪、模糊、抖动、水印）
  - 叠加 BGM 混音和音频处理
  - 输出为 H.264 + AAC 编码的 MP4 文件
"""
import json
import re
from pathlib import Path
from typing import TYPE_CHECKING

from video_batch.environment import ffmpeg_path, _run_no_window
from video_batch.video_output_spec import (
    normalize_video_filter,
    video_encoding_args,
    audio_encoding_args,
)

if TYPE_CHECKING:
    from video_batch.logger import Logger

_SUBTITLE_FORCE_STYLE = (
    "Fontsize=9,Outline=1,Shadow=0,MarginV=24,Alignment=2,WrapStyle=2"
)


class ReferenceVideoError(Exception):
    """参考视频处理异常，FFmpeg 执行失败时抛出。"""
    pass


class ReferenceVideoProcessor:
    """参考视频处理器，对原始视频应用效果和混音。

    该类构建复杂的 FFmpeg 命令，包含：
      - 视频滤镜链（video_filters + overlay_filters）
      - 音频滤镜和混音（audio_filters）
      - 多输入源（参考视频 + BGM + 叠加元素）

    属性:
        _logger: 日志记录器（可选）
    """

    def __init__(self, logger: "Logger | None" = None) -> None:
        """初始化参考视频处理器。

        参数:
            logger: 日志记录器实例（可选）
        """
        self._logger = logger

    def process(
        self,
        reference_video: Path,
        output_path: Path,
        video_filters: list[str],
        overlay_filters: list[str],
        overlay_inputs: list[str],
        audio_filters: list[str],
        audio_inputs: list[str],
        fps: int = 30,
        loop_count: int = 1,
        subtitle_srt_path: Path | None = None,
        replacement_audio_path: Path | None = None,
        repeat_subtitle_and_replacement_audio: bool = True,
    ) -> Path:
        """处理参考视频，应用所有滤镜和混音。

        参数:
            reference_video: 原始参考视频路径
            output_path: 输出视频路径
            video_filters: 视频效果滤镜列表
            overlay_filters: 叠加元素滤镜列表
            overlay_inputs: 叠加元素的额外输入参数（如水印图片）
            audio_filters: 音频处理滤镜列表
            audio_inputs: 音频额外输入参数（如 BGM 文件）
            fps: 输出视频帧率（默认 30）
            loop_count: 视频循环播放次数（默认 1，>1 时内部注入 -stream_loop）
        返回:
            输出视频文件路径
        抛出:
            ReferenceVideoError: FFmpeg 处理失败时抛出
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        n_overlay = len(overlay_inputs) // 2

        effective_video_filters = list(video_filters)
        effective_subtitle_path = subtitle_srt_path
        if (
            subtitle_srt_path is not None
            and loop_count > 1
            and repeat_subtitle_and_replacement_audio
        ):
            video_duration = _probe_video_duration(reference_video)
            effective_subtitle_path = _expand_srt_for_loop(
                subtitle_srt_path,
                output_path.with_name("%s_looped.srt" % subtitle_srt_path.stem),
                video_duration,
                loop_count,
            )
        if effective_subtitle_path is not None:
            effective_video_filters.append(
                "subtitles=filename='%s':force_style='%s'" % (
                    _escape_filter_path(effective_subtitle_path),
                    _SUBTITLE_FORCE_STYLE,
                ),
            )
        effective_audio_filters = list(audio_filters)
        effective_audio_inputs = list(audio_inputs)
        replacement_audio_index = None
        if replacement_audio_path is not None:
            replacement_audio_index = 1 + n_overlay + (len(effective_audio_inputs) // 2)

        filter_complex = self._build_filter_complex(
            effective_video_filters,
            overlay_filters,
            effective_audio_filters,
            n_overlay,
            replacement_audio_index,
        )

        cmd = self._build_command(
            reference_video, output_path, filter_complex,
            overlay_inputs, effective_audio_inputs, fps, loop_count,
            replacement_audio_path, replacement_audio_index, bool(effective_audio_filters),
            repeat_replacement_audio=repeat_subtitle_and_replacement_audio,
        )

        result = _run_no_window(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )

        if result.returncode != 0:
            stderr_msg = (result.stderr or "").strip()
            raise ReferenceVideoError(
                "参考视频处理失败: %s" % stderr_msg
            )

        if self._logger:
            self._logger.info(
                task_id="reference",
                module="参考视频处理",
                message="原视频参考模式处理完成: %s → %s" % (reference_video.name, output_path),
            )

        return output_path

    def _build_filter_complex(
        self,
        video_filters: list[str],
        overlay_filters: list[str],
        audio_filters: list[str],
        n_overlay: int = 0,
        replacement_audio_index: int | None = None,
    ) -> str:
        """构建 FFmpeg -filter_complex 字符串。

        视频效果滤镜链和叠加元素滤镜链以分号分隔，
        视频滤镜链输出标签 [v_base] 供叠加元素基底线引用。
        音频滤镜中 [1:a] 会被修正为正确的输入索引（因 overlay 在音频之前插入）。

        参数:
            video_filters: 视频效果滤镜（抽帧/裁剪/模糊/色彩等）
            overlay_filters: 叠加元素滤镜（水印/贴纸）
            audio_filters: 音频处理滤镜
            n_overlay: 叠加输入文件数量（用于修正音频输入索引）
        返回:
            完整的 filter_complex 字符串
        """
        parts: list[str] = []
        video_input_label = "[0:v]"

        if video_filters:
            if overlay_filters:
                v_chain = "[0:v]" + ",".join(video_filters) + "[v_base]"
                video_input_label = "[v_base]"
            else:
                v_chain = "[0:v]" + ",".join(video_filters) + "[v_base]"
                video_input_label = "[v_base]"
            parts.append(v_chain)

        connected_overlay_filters, overlay_output_label = _connect_terminal_watermark_output(
            overlay_filters,
        )
        parts.extend(connected_overlay_filters)
        if overlay_output_label is not None:
            video_input_label = overlay_output_label

        parts.append("%s%s[vout]" % (video_input_label, normalize_video_filter()))

        # 修正音频滤镜中的 BGM 输入索引：[1:a] → [{n_overlay + 1}:a]
        bgm_idx = n_overlay + 1
        for index, af in enumerate(audio_filters):
            rewritten = af.replace("[1:a]", "[%d:a]" % bgm_idx)
            if replacement_audio_index is not None:
                if "[0:a]" in rewritten:
                    rewritten = rewritten.replace("[0:a]", "[%d:a]" % replacement_audio_index)
                elif not rewritten.startswith("["):
                    rewritten = "[%d:a]%s" % (replacement_audio_index, rewritten)
            if index == len(audio_filters) - 1:
                rewritten = _label_terminal_audio_filter(rewritten)
            parts.append(rewritten)

        return ";".join(parts)

    def _build_command(
        self,
        reference_video: Path,
        output_path: Path,
        filter_complex: str,
        overlay_inputs: list[str],
        audio_inputs: list[str],
        fps: int,
        loop_count: int = 1,
        replacement_audio_path: Path | None = None,
        replacement_audio_index: int | None = None,
        replacement_audio_has_filters: bool = False,
        repeat_replacement_audio: bool = True,
    ) -> list[str]:
        """构建完整的 FFmpeg 命令行参数列表。

        当 loop_count > 1 时，在首个输入前插入 -stream_loop N-1，
        使输入视频循环播放指定次数。

        参数:
            reference_video: 参考视频路径（作为第一个输入 -i）
            output_path: 输出路径
            filter_complex: 已构建的滤镜链字符串
            overlay_inputs: 叠加元素的额外输入参数
            audio_inputs: 音频的额外输入参数
            fps: 输出帧率
            loop_count: 循环次数（>1 时注入 -stream_loop）
        返回:
            完整的 FFmpeg 命令参数列表
        """
        cmd = [
            ffmpeg_path(), "-y",
        ]

        if loop_count > 1:
            cmd.extend(["-stream_loop", str(loop_count - 1)])

        cmd.extend([
            "-i", str(reference_video),
        ])

        # 叠加元素输入排在音频之前，确保 [1:v]/[2:v] 索引正确
        cmd.extend(overlay_inputs)
        cmd.extend(_loop_audio_inputs(audio_inputs, loop_count))
        if replacement_audio_path is not None:
            if replacement_audio_index is None:
                replacement_audio_index = 1 + (len(overlay_inputs) // 2) + (len(audio_inputs) // 2)
            if loop_count > 1 and repeat_replacement_audio:
                cmd.extend(["-stream_loop", str(loop_count - 1)])
            cmd.extend(["-i", str(replacement_audio_path)])

        if filter_complex:
            cmd.extend(["-filter_complex", filter_complex])
            cmd.extend(["-map", "[vout]"])

        if replacement_audio_index is not None and not replacement_audio_has_filters:
            cmd.extend(["-map", "%d:a:0" % replacement_audio_index])
        elif replacement_audio_has_filters:
            cmd.extend(["-map", "[aout]"])

        cmd.extend(video_encoding_args("libx264", fps))
        cmd.extend(audio_encoding_args("aac"))
        cmd.append(str(output_path))

        return cmd


def _escape_filter_path(path: Path) -> str:
    value = str(Path(path)).replace("\\", "/")
    value = value.replace(":", r"\:")
    value = value.replace("'", r"\'")
    return value


def _connect_terminal_watermark_output(
    overlay_filters: list[str],
) -> tuple[list[str], str | None]:
    """Make a lone watermark output the final video stream instead of a dangling label."""
    if ";".join(overlay_filters).count("[wm_out]") != 1:
        return list(overlay_filters), None

    connected: list[str] = []
    output_label = None
    for item in overlay_filters:
        stripped = item.rstrip()
        trailing = item[len(stripped):]
        if stripped.endswith("[wm_out]"):
            item = stripped
            output_label = "[wm_out]"
        connected.append(item)
    return connected, output_label


def _label_terminal_audio_filter(audio_filter: str) -> str:
    if re.search(r"\[[A-Za-z0-9_]+]$", audio_filter):
        return audio_filter
    return audio_filter + "[aout]"


def _loop_audio_inputs(audio_inputs: list[str], loop_count: int) -> list[str]:
    if loop_count <= 1:
        return list(audio_inputs)

    looped: list[str] = []
    for item in audio_inputs:
        if item == "-i":
            looped.extend(["-stream_loop", "-1", "-i"])
        else:
            looped.append(item)
    return looped


def _probe_video_duration(video_path: Path) -> float:
    result = _run_no_window(
        [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_entries", "format=duration", str(video_path),
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise ReferenceVideoError(
            "循环字幕时探测视频时长失败: %s" % ((result.stderr or "").strip()),
        )
    try:
        data = json.loads(result.stdout or "{}")
        duration = float(data.get("format", {}).get("duration", 0))
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise ReferenceVideoError("循环字幕时解析视频时长失败") from exc
    if duration <= 0:
        raise ReferenceVideoError("循环字幕时视频时长无效")
    return duration


_SRT_TIMESTAMP_RE = re.compile(r"(\d{2}):(\d{2}):(\d{2}),(\d{3})")


def _expand_srt_for_loop(
    source_path: Path,
    target_path: Path,
    cycle_duration: float,
    loop_count: int,
) -> Path:
    source = source_path.read_text(encoding="utf-8-sig")
    blocks = [block for block in re.split(r"\r?\n\r?\n", source.strip()) if block.strip()]
    expanded: list[str] = []
    index = 1
    for loop_index in range(loop_count):
        offset = cycle_duration * loop_index
        for block in blocks:
            lines = block.splitlines()
            if lines and lines[0].strip().isdigit():
                lines[0] = str(index)
            else:
                lines.insert(0, str(index))
            expanded.append(
                "\n".join(_offset_srt_timestamps(line, offset) for line in lines),
            )
            index += 1
    target_path.write_text("\n\n".join(expanded) + "\n", encoding="utf-8")
    return target_path


def _offset_srt_timestamps(line: str, offset_seconds: float) -> str:
    return _SRT_TIMESTAMP_RE.sub(
        lambda match: _format_srt_timestamp(
            _parse_srt_timestamp(match) + offset_seconds,
        ),
        line,
    )


def _parse_srt_timestamp(match: re.Match[str]) -> float:
    hours = int(match.group(1))
    minutes = int(match.group(2))
    seconds = int(match.group(3))
    milliseconds = int(match.group(4))
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0


def _format_srt_timestamp(total_seconds: float) -> str:
    total_ms = int(round(total_seconds * 1000))
    hours, remainder = divmod(total_ms, 3600 * 1000)
    minutes, remainder = divmod(remainder, 60 * 1000)
    seconds, milliseconds = divmod(remainder, 1000)
    return "%02d:%02d:%02d,%03d" % (hours, minutes, seconds, milliseconds)
