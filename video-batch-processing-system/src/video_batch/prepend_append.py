"""
前后贴拼接模块 - 视频片头片尾处理

负责从指定目录随机选择前贴（片头）和后贴（片尾）视频素材，
并使用 FFmpeg concat 协议将其与主视频拼接在一起。
"""

import random
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

from video_batch.environment import ffmpeg_path, _run_no_window
from video_batch.randomization_config import MediaFormatsConfig
from video_batch.video_output_spec import (
    OUTPUT_SIZE,
    normalize_video_filter,
    video_encoding_args,
    audio_encoding_args,
)

if TYPE_CHECKING:
    from video_batch.logger import Logger


class AffixError(Exception):
    """前后贴拼接异常"""
    pass


@dataclass
class AffixResult:
    """前后贴拼接结果"""
    output_path: Path              # 输出视频路径
    prepend_path: Path | None = None  # 使用的前贴视频路径
    append_path: Path | None = None   # 使用的后贴视频路径


class VideoAffixer:
    """
    视频前后贴拼接器

    从指定目录随机选择前后贴视频素材，使用 FFmpeg concat 协议
    将前贴、主视频、后贴按顺序拼接成完整视频。
    """
    _DEFAULT_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

    def __init__(
        self,
        prepend_dir: Path | None = None,  # 前贴视频素材目录
        append_dir: Path | None = None,   # 后贴视频素材目录
        logger: "Logger | None" = None,    # 日志记录器
        formats_config: MediaFormatsConfig | None = None,  # 支持的视频格式配置
    ) -> None:
        self._prepend_dir = prepend_dir
        self._append_dir = append_dir
        self._logger = logger
        self._formats = formats_config if formats_config is not None else MediaFormatsConfig()

    _UNSET = object()

    def update_dirs(
        self,
        prepend_dir: Path | None = _UNSET,  # 新的前贴目录，_UNSET 表示不更新
        append_dir: Path | None = _UNSET,   # 新的后贴目录，_UNSET 表示不更新
    ) -> None:
        """
        更新前后贴素材目录

        仅当参数不是 _UNSET 时才更新对应目录，允许单独更新某一个目录。
        """
        if prepend_dir is not self._UNSET:
            self._prepend_dir = prepend_dir
        if append_dir is not self._UNSET:
            self._append_dir = append_dir

    def prepend_append(
        self, main_video: Path, output_path: Path,
        target_size: tuple[int, int] | None = None,
    ) -> AffixResult:
        """
        执行前后贴拼接操作

        从前后贴目录各随机选择一个视频，与主视频按顺序拼接。

        参数:
            main_video: 主视频文件路径
            output_path: 输出文件路径

        返回:
            AffixResult: 拼接结果，包含输出路径和使用的前后贴路径

        异常:
            AffixError: 拼接失败时抛出
        """
        output_path = Path(output_path)

        # 从各自目录随机选择前后贴视频
        prepend_path = self._pick_video(self._prepend_dir)
        append_path = self._pick_video(self._append_dir)

        # 如果前后贴素材均不可用，直接返回主视频
        if prepend_path is None and append_path is None:
            if self._logger:
                self._logger.info(
                    task_id="affixer",
                    module="前后贴拼接",
                    message="无前后贴素材，跳过拼接",
                )
            return AffixResult(output_path=main_video)

        # 按 前贴 -> 主视频 -> 后贴 顺序构建视频列表
        video_list = []
        if prepend_path is not None:
            video_list.append(prepend_path)
        video_list.append(main_video)
        if append_path is not None:
            video_list.append(append_path)

        # 调用 FFmpeg 执行拼接
        self._concat_videos(video_list, output_path, target_size)

        # 记录拼接结果到日志
        if self._logger:
            parts = []
            if prepend_path:
                parts.append(f"前贴: {prepend_path.name}")
            parts.append(f"主视频: {main_video.name}")
            if append_path:
                parts.append(f"后贴: {append_path.name}")
            self._logger.info(
                task_id="affixer",
                module="前后贴拼接",
                message="拼接完成: " + " + ".join(parts),
            )

        return AffixResult(
            output_path=output_path,
            prepend_path=prepend_path,
            append_path=append_path,
        )

    def _pick_video(self, directory: Path | None) -> Path | None:
        """
        从指定目录随机选择一个视频文件

        参数:
            directory: 视频文件目录路径

        返回:
            随机选择的视频文件路径，目录无效或无可用文件时返回 None
        """
        if directory is None:
            return None

        dir_path = Path(directory)
        # 检查目录是否存在且有效
        if not dir_path.exists() or not dir_path.is_dir():
            return None

        # 筛选出支持格式的视频文件
        videos = sorted([
            p for p in dir_path.iterdir()
            if p.is_file()
            and p.suffix.lstrip(".").lower() in self._formats.video_formats
        ])

        if not videos:
            return None

        return random.choice(videos)

    def _concat_videos(
        self, video_list: list[Path], output_path: Path,
        target_size: tuple[int, int] | None = None,
    ) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if target_size is None:
            target_size = OUTPUT_SIZE
        video_filter = normalize_video_filter()

        cmd = [ffmpeg_path(), "-y"]

        for v in video_list:
            cmd.extend(["-i", str(v)])

        n = len(video_list)
        filter_parts: list[str] = []
        for i in range(n):
            filter_parts.append(
                "[{i}:v]{vf}[v{i}]".format(
                    i=i, vf=video_filter,
                )
            )
            filter_parts.append(
                "[{i}:a]aresample=async=1:first_pts=0[a{i}]".format(i=i)
            )

        stream_parts = "".join("[v{i}][a{i}]".format(i=i) for i in range(n))
        filter_parts.append(
            "{streams}concat=n={n}:v=1:a=1[outv][outa]".format(
                streams=stream_parts, n=n,
            )
        )

        filter_complex = ";".join(filter_parts)

        cmd.extend([
            "-filter_complex", filter_complex,
            "-map", "[outv]",
            "-map", "[outa]",
        ])
        cmd.extend(video_encoding_args("libx264", 30))
        cmd.extend(audio_encoding_args("aac"))
        cmd.append(str(output_path))

        result = _run_no_window(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )

        if result.returncode != 0:
            raise AffixError(
                "前后贴拼接失败: %s" % (result.stderr or "").strip()
            )
