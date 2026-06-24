"""视频转换器 - 将图片序列转换为 H.264 MP4 视频。

VideoConverter 类负责图生视频流程中的图片转视频步骤：
  - 无转场：使用 FFmpeg concat demuxer 拼接多张图片
  - 带转场：使用 FFmpeg xfade 滤镜链实现图片间渐变切换
  - 每张图片按配置的时长播放
  - 输出为 H.264 编码的 MP4 文件（无声视频）
"""
import random
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from video_batch.environment import ffmpeg_path, _run_no_window
from video_batch.video_output_spec import (
    OUTPUT_SIZE,
    normalize_video_filter,
    video_encoding_args,
)

if TYPE_CHECKING:
    from video_batch.logger import Logger


@dataclass
class ConversionConfig:
    """视频转换配置。

    属性:
        fps: 输出视频帧率（默认 30）
        codec: 视频编码器（默认 libx264）
        duration_per_image: 每张图片的播放时长（秒）
        transition: 转场效果配置（None 表示不使用转场）
    """
    fps: int = 30
    codec: str = "libx264"
    duration_per_image: float = 5.0
    transition: "TransitionConfig | None" = None


@dataclass
class TransitionConfig:
    """转场效果配置。

    enabled=True 且图片 ≥2 张时启用 xfade 转场链。

    属性:
        enabled: 是否启用转场（默认 False）
        duration: 转场时长（秒）
        types: 可选转场类型列表，为 None 时随机从内置列表选择
    """
    enabled: bool = False
    duration: float = 0.5
    types: list[str] | None = None

    _DEFAULT_TYPES: list[str] = field(default_factory=lambda: [
        "fade", "fadeblack", "fadewhite",
        "dissolve",
        "slideright", "slideleft", "slideup", "slidedown",
        "wiperight", "wipeleft", "wipeup", "wipedown",
        "circlecrop",
        "rectcrop",
        "pixelize",
    ], repr=False, compare=False)

    def pick_type(self) -> str:
        """随机选择一种转场类型。

        返回:
            转场类型名称字符串
        """
        pool = self.types if self.types else self._DEFAULT_TYPES
        return random.choice(pool)


class ConversionError(Exception):
    """视频转换异常，FFmpeg 执行失败时抛出。"""
    pass


def _make_even(value: int) -> int:
    return value if value % 2 == 0 else value + 1


class VideoConverter:
    """视频转换器，将图片列表转换为视频文件。

    工作流程：
      1. 生成 concat demuxer 文件（包含图片路径和时长）
      2. 调用 FFmpeg 执行转换
      3. 输出无声视频文件（后续步骤会添加音频）

    属性:
        _logger: 日志记录器（可选）
    """

    def __init__(self, logger: "Logger | None" = None) -> None:
        """初始化视频转换器。

        参数:
            logger: 日志记录器实例（可选）
        """
        self._logger = logger

    def images_to_video(
        self, images: list[Path], output_path: Path, config: ConversionConfig,
    ) -> Path:
        """将图片列表转换为视频文件。

        当 config.transition.enabled=True 且图片 ≥2 张时，自动使用 xfade 转场链；
        否则回退到 concat demuxer 方式。

        参数:
            images: 图片路径列表，按拼接顺序排列
            output_path: 输出视频文件路径
            config: 转换配置（可包含转场配置）
        返回:
            输出视频文件的实际路径
        抛出:
            ConversionError: FFmpeg 转换失败时抛出
        """
        if config.transition and config.transition.enabled and len(images) >= 2:
            return self._images_to_video_xfade(images, output_path, config)
        return self._images_to_video_concat(images, output_path, config)

    def _images_to_video_concat(
        self, images: list[Path], output_path: Path, config: ConversionConfig,
    ) -> Path:
        """无转场：concat demuxer 方式拼接图片。

        参数:
            images: 图片路径列表
            output_path: 输出视频文件路径
            config: 转换配置
        返回:
            输出视频文件路径
        抛出:
            ConversionError: FFmpeg 失败时抛出
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        cmd = self._build_still_image_concat_command(images, output_path, config)

        result = _run_no_window(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )

        if result.returncode != 0:
            raise ConversionError("FFmpeg 转换失败: %s" % (result.stderr or "").strip())

        if self._logger:
            self._logger.info(
                task_id="converter",
                module="视频转换",
                message="图片 %d 张 → %s (concat)" % (len(images), output_path),
            )

        return output_path

    def _build_still_image_concat_command(
        self,
        images: list[Path],
        output_path: Path,
        config: ConversionConfig,
    ) -> list[str]:
        """Build a concat-filter command that reads each image with its own decoder."""
        cmd = [ffmpeg_path(), "-y"]
        for img in images:
            cmd.extend(["-loop", "1", "-t", str(config.duration_per_image), "-i", str(img)])

        if len(images) == 1:
            cmd.extend([
                "-vf", normalize_video_filter(config.fps),
                *video_encoding_args(config.codec, config.fps),
                str(output_path),
            ])
            return cmd

        normalize_parts = [
            (
                "[%d:v]%s[v%d]"
            ) % (idx, normalize_video_filter(config.fps), idx)
            for idx in range(len(images))
        ]
        concat_inputs = "".join("[v%d]" % idx for idx in range(len(images)))
        filter_complex = "%s;%sconcat=n=%d:v=1:a=0[vout]" % (
            ";".join(normalize_parts),
            concat_inputs,
            len(images),
        )
        cmd.extend([
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            *video_encoding_args(config.codec, config.fps),
            str(output_path),
        ])
        return cmd

    def _target_canvas_size(self, images: list[Path]) -> tuple[int, int]:
        return OUTPUT_SIZE

    def _read_image_size(self, image_path: Path) -> tuple[int, int]:
        try:
            from PIL import Image

            with Image.open(image_path) as image:
                return image.size
        except Exception:
            return self._probe_image_size(image_path)

    def _build_concat_file(self, images: list[Path], config: ConversionConfig) -> Path:
        """生成 FFmpeg concat demuxer 文件（写入系统临时目录）。

        concat 文件格式要求：
          - 每张图片需要 file 和 duration 两行
          - 最后一张图片需要额外的 file 行（FFmpeg 限制）

        参数:
            images: 图片路径列表
            config: 转换配置，包含每张图片的时长
        返回:
            concat 文件路径
        """
        lines = []
        for img in images:
            lines.append("file '%s'" % str(img.resolve()).replace("\\", "/"))
            lines.append("duration %.1f" % config.duration_per_image)
        lines.append("file '%s'" % str(images[-1].resolve()).replace("\\", "/"))
        tf = tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", encoding="utf-8", delete=False,
        )
        tf.write("\n".join(lines))
        tf.close()
        return Path(tf.name)

    def _probe_image_size(self, image_path: Path) -> tuple[int, int]:
        """用 ffprobe 探测图片的分辨率。

        参数:
            image_path: 图片文件路径
        返回:
            (width, height) 元组；探测失败时返回默认值 (1024, 1024)
        """
        try:
            result = _run_no_window(
                ["ffprobe", "-v", "error", "-select_streams", "v:0",
                 "-show_entries", "stream=width,height", "-of", "csv=p=0", str(image_path)],
                capture_output=True, text=True,
            )
            w_str, h_str = result.stdout.strip().split(",")
            return int(w_str), int(h_str)
        except Exception:
            if self._logger:
                self._logger.warning(
                    task_id="converter", module="视频转换",
                    message="无法探测图片尺寸: %s，使用默认 1024x1024" % image_path,
                )
            return (1024, 1024)

    def _images_to_video_xfade(
        self, images: list[Path], output_path: Path, config: ConversionConfig,
    ) -> Path:
        """带转场：xfade 滤镜链方式拼接图片。

        每张图片作为独立输入，通过 xfade 滤镜链逐个切换，
        每次转场类型随机从 TransitionConfig.pick_type() 选取。

        不同分辨率的图片会先被 scale+pad 滤镜统一缩放到相同尺寸，
        以满足 xfade 滤镜对输入分辨率一致的要求。

        参数:
            images: 图片路径列表（≥2 张）
            output_path: 输出视频文件路径
            config: 转换配置（必须包含 enabled=True 的 transition）
        返回:
            输出视频文件路径
        抛出:
            ConversionError: FFmpeg 失败时抛出
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        tc = config.transition
        dur = config.duration_per_image
        td = tc.duration
        n = len(images)

        # 统一到最大画布，避免不同尺寸图片进入 xfade 时参数不一致
        target_w, target_h = self._target_canvas_size(images)

        # 每张图片作为独立输入：-loop 1 -t {dur} -i img
        xfade_inputs: list[str] = []
        for img in images:
            xfade_inputs.extend(["-loop", "1", "-t", str(dur), "-i", str(img)])

        # 构建 scale+pad 前缀滤镜：将每张图片缩放到统一的分辨率
        scale_parts: list[str] = []
        for i in range(n):
            scale_parts.append(
                "[{i}]{vf}[s{i}]".format(
                    i=i, vf=normalize_video_filter(config.fps),
                )
            )

        # 构建 xfade 链：使用缩放后的流标签 [s{i}] 替代原始 [i]
        xfade_parts: list[str] = []
        prev_label = "[s0]"
        for i in range(1, n):
            offset = i * dur - i * td
            ttype = tc.pick_type()
            if i == n - 1:
                out_label = "[vout]"
            else:
                out_label = "[v{}]".format(i)
            xfade_parts.append(
                "{prev}[s{idx}]xfade=transition={type}:duration={td}:offset={offset:.3f}{out}".format(
                    prev=prev_label, idx=i, type=ttype,
                    td=td, offset=offset, out=out_label,
                )
            )
            prev_label = out_label

        filter_complex = ";".join(scale_parts + xfade_parts)

        cmd = [
            ffmpeg_path(), "-y",
        ] + xfade_inputs + [
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            *video_encoding_args(config.codec, config.fps),
            str(output_path),
        ]

        result = _run_no_window(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )

        if result.returncode != 0:
            raise ConversionError("xfade 转场失败: %s" % (result.stderr or "").strip())

        if self._logger:
            self._logger.info(
                task_id="converter",
                module="视频转换",
                message="图片 %d 张 → %s (xfade, %dx%d)" % (len(images), output_path, target_w, target_h),
            )

        return output_path
