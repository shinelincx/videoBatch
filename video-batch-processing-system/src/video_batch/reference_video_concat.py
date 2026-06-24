"""原视频参考模式 - 素材图片合并处理器。

在原视频参考模式下，将素材目录中的图片转为视频片段，
按配置位置（before/after）与参考视频拼接为一个整体。
若图片目录为空或不存在，则降级为直接使用参考视频。
"""
import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

from video_batch.environment import ffmpeg_path, _run_no_window
from video_batch.video_converter import ConversionConfig, VideoConverter
from video_batch.video_output_spec import (
    OUTPUT_SIZE,
    normalize_video_filter,
    video_encoding_args,
    audio_encoding_args,
)

if TYPE_CHECKING:
    from video_batch.logger import Logger


@dataclass
class ImageConcatConfig:
    """图片拼接配置。

    属性:
        img_video_position: 图片视频拼接位置，"before"（参考视频前）或 "after"（参考视频后）
        image_duration: 每张图片展示时长（秒），所有图片统一使用
    """
    img_video_position: str = "after"
    image_duration: float = 2.0


class ReferenceVideoConcatError(Exception):
    """图片视频拼接异常，FFmpeg 执行失败时抛出。"""
    pass


class ReferenceVideoConcatProcessor:
    """原视频参考模式 - 素材图片合并处理器。

    工作流程：
      1. 扫描素材图片目录，获取图片列表（按文件名排序）
      2. 如目录为空/不存在 → 降级，复制参考视频到输出路径
      3. 调用 VideoConverter 将图片转为视频片段
      4. 使用 FFmpeg concat 滤镜将图片视频与参考视频拼接

    属性:
        _logger: 日志记录器（可选）
        _video_converter: 图片转视频转换器
    """

    def __init__(self, logger: "Logger | None" = None) -> None:
        """初始化素材图片合并处理器。

        参数:
            logger: 日志记录器实例（可选）
        """
        self._logger = logger
        self._video_converter = VideoConverter(logger=logger)

    def process(
        self,
        task_id: str,
        img_dir: Path,
        reference_video: Path,
        output_path: Path,
        config: ImageConcatConfig,
        target_size: tuple[int, int] | None = None,
    ) -> Path:
        """处理素材图片合并。

        参数:
            task_id: 任务唯一标识
            img_dir: 素材图片目录（如 assets/input/{task_id}/img/）
            reference_video: 参考视频路径
            output_path: 输出视频路径
            config: 图片拼接配置
        返回:
            合并后的视频路径（降级时指向参考视频副本）
        抛出:
            ReferenceVideoConcatError: 图片转视频或拼接失败时抛出
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        images = self._scan_images(img_dir)
        if not images:
            self._fallback_to_reference(task_id, img_dir, reference_video, output_path)
            return output_path

        try:
            img_clip = self._images_to_clip(task_id, images, config)
        except ReferenceVideoConcatError:
            self._fallback_to_reference(
                task_id, img_dir, reference_video, output_path,
                reason="图片转换失败",
            )
            return output_path

        try:
            self._concat(task_id, img_clip, reference_video, output_path, config, target_size)
        except ReferenceVideoConcatError:
            if img_clip.exists():
                img_clip.unlink(missing_ok=True)
            raise

        if img_clip.exists():
            img_clip.unlink(missing_ok=True)

        return output_path

    def _scan_images(self, img_dir: Path) -> list[Path]:
        """扫描素材图片目录，返回按文件名排序的图片列表。

        支持 JPG、PNG、WebP 格式。

        参数:
            img_dir: 素材图片目录路径
        返回:
            排序后的图片路径列表；目录不存在或为空时返回空列表
        """
        if not img_dir.exists() or not img_dir.is_dir():
            return []

        supported = {".jpg", ".jpeg", ".png", ".webp"}
        images = sorted(
            p for p in img_dir.iterdir()
            if p.is_file() and p.suffix.lower() in supported
        )
        return images

    def _fallback_to_reference(
        self,
        task_id: str,
        img_dir: Path,
        reference_video: Path,
        output_path: Path,
        reason: str | None = None,
    ) -> None:
        """降级策略：图片素材缺失或转换失败时直接复制参考视频到输出。

        参数:
            task_id: 任务唯一标识
            img_dir: 素材图片目录
            reference_video: 参考视频路径
            output_path: 输出路径
            reason: 降级原因，为 None 时自动推断
        """
        shutil.copy2(reference_video, output_path)

        if reason is None:
            reason = "目录不存在" if not img_dir.exists() else "目录为空"
        if self._logger:
            self._logger.warning(
                task_id=task_id,
                module="图片视频拼接",
                message="图片素材%s，跳过拼接，降级为原始参考视频: %s" % (
                    reason, img_dir,
                ),
            )

    def _images_to_clip(
        self, task_id: str, images: list[Path], config: ImageConcatConfig,
    ) -> Path:
        """将图片列表转为临时视频片段。

        参数:
            task_id: 任务唯一标识
            images: 排序后的图片路径列表
            config: 图片拼接配置
        返回:
            临时视频片段路径
        抛出:
            ReferenceVideoConcatError: FFmpeg 转换失败时抛出
        """
        conv_config = ConversionConfig(
            duration_per_image=config.image_duration,
        )

        clip_path = Path(tempfile.mktemp(suffix=".mp4"))

        try:
            return self._video_converter.images_to_video(
                images=images,
                output_path=clip_path,
                config=conv_config,
            )
        except Exception as e:
            raise ReferenceVideoConcatError(
                "图片转视频失败: %s" % e
            ) from e

    def _concat(
        self,
        task_id: str,
        image_clip: Path,
        reference_video: Path,
        output_path: Path,
        config: ImageConcatConfig,
        target_size: tuple[int, int] | None = None,
    ) -> None:
        """使用 FFmpeg concat 滤镜将图片视频片段与参考视频拼接。

        图片视频片段为无声视频，拼接时需要为无声输入生成静音音轨。

        参数:
            task_id: 任务唯一标识
            image_clip: 图片视频片段路径
            reference_video: 参考视频路径
            output_path: 输出路径
            config: 图片拼接配置
        抛出:
            ReferenceVideoConcatError: FFmpeg 拼接失败时抛出
        """
        first_input = image_clip if config.img_video_position == "before" else reference_video
        second_input = reference_video if config.img_video_position == "before" else image_clip
        img_is_first = config.img_video_position == "before"

        img_duration = self._probe_duration(image_clip)

        if img_is_first:
            audio_label = "a0"
            concat_part = "[v0][a0][v1][1:a]concat=n=2:v=1:a=1[outv][outa]"
        else:
            audio_label = "a1"
            concat_part = "[v0][0:a][v1][a1]concat=n=2:v=1:a=1[outv][outa]"

        if target_size is None:
            target_size = OUTPUT_SIZE
        video_filter = normalize_video_filter()

        filter_complex = (
            "[0:v]{vf}[v0];"
            "[1:v]{vf}[v1];"
            "anullsrc=channel_layout=stereo:sample_rate=44100,"
            "atrim=duration={dur},asetpts=PTS-STARTPTS[{label}];"
            "{concat}"
        ).format(vf=video_filter, dur=img_duration, label=audio_label, concat=concat_part)

        cmd = [
            ffmpeg_path(), "-y",
            "-i", str(first_input),
            "-i", str(second_input),
            "-filter_complex", filter_complex,
            "-map", "[outv]",
            "-map", "[outa]",
        ]
        cmd.extend(video_encoding_args("libx264", 30))
        cmd.extend(audio_encoding_args("aac"))
        cmd.append(str(output_path))

        result = _run_no_window(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )

        if result.returncode != 0:
            stderr_msg = (result.stderr or "").strip()
            raise ReferenceVideoConcatError(
                "视频拼接失败: %s" % stderr_msg
            )

        if self._logger:
            self._logger.info(
                task_id=task_id,
                module="图片视频拼接",
                message="图片视频片段 + 参考视频 → %s (位置: %s, %d张图片)" % (
                    output_path.name, config.img_video_position, 1,
                ),
            )

    def _probe_duration(self, video_path: Path) -> float:
        """用 ffprobe 探测视频时长。

        参数:
            video_path: 视频文件路径
        返回:
            视频时长（秒），探测失败时返回默认值 5.0
        """
        import json
        result = _run_no_window(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_format", str(video_path)],
            capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )
        if result.returncode == 0:
            try:
                info = json.loads(result.stdout)
                return float(info.get("format", {}).get("duration", 5.0))
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        return 5.0
