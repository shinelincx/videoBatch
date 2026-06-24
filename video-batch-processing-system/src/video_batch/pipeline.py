"""视频剪辑管线 — 按 PRD 定义的严格顺序编排编辑步骤。

VideoEditingPipeline 是两种剪辑模式的统一入口：
  - 图生视频（image-to-video）：图片 → 视频 → 效果 → 拼接
  - 参考生视频（reference-video）：图片+参考视频拼接 → 效果 → 拼接

管线通过 PipelineContext 接收输入数据，按 PRD 第 6 节定义的
处理顺序链式调用各处理模块，输出最终视频路径。
"""
import json
import random
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from video_batch.environment import ffmpeg_path, _run_no_window
from video_batch.audio_processor import AudioProcessingConfig, AudioProcessor
from video_batch.frame_randomizer import FrameRandomizationConfig, FrameRandomizer
from video_batch.local_config import LocalConfig
from video_batch.material_scanner import MaterialIndex
from video_batch.overlay_elements import OverlayConfig, OverlayElementBuilder
from video_batch.prepend_append import VideoAffixer
from video_batch.reference_video import ReferenceVideoProcessor
from video_batch.reference_video_concat import (
    ImageConcatConfig,
    ReferenceVideoConcatProcessor,
)
from video_batch.video_converter import (
    ConversionConfig,
    TransitionConfig,
    VideoConverter,
)
from video_batch.video_output_spec import OUTPUT_SIZE

if TYPE_CHECKING:
    from video_batch.config_sync import UserConfig
    from video_batch.logger import Logger
    from video_batch.task_queue import Task


class PipelineError(Exception):
    """剪辑管线异常，任一编辑步骤失败时抛出。"""
    pass


@dataclass
class EditDirs:
    """辅助素材目录 — 背景音乐、水印、贴纸、前后贴等可选素材的路径。

    由调用方从 LocalConfig 解析后注入。
    """
    bgm_dir: Path
    output_dir: Path
    watermark_dir: Path
    sticker_dir: Path
    prepend_dir: Path
    append_dir: Path
    img_dir: Path = Path("NONEXISTENT")


@dataclass
class PipelineContext:
    """剪辑管线上下文 — 所有编辑步骤需要的输入数据。

    调用方负责前置工作：任务获取、配置同步、素材扫描、文案生成。
    管线仅负责编辑步骤，不涉及网络 I/O。

    extra_video_filters 和 extra_audio_inputs 允许调用方在管线
    自动构建的滤镜基础上追加自定义滤镜（如字幕、弹幕、TTS 音频等）。
    """
    task: "Task"
    user_config: "UserConfig"
    local_config: LocalConfig
    material_index: MaterialIndex
    scratch_dir: Path
    dirs: EditDirs
    logger: "Logger | None" = None
    extra_video_filters: list[str] = field(default_factory=list)
    extra_audio_inputs: list[str] = field(default_factory=list)
    subtitle_srt_path: Path | None = None
    replacement_audio_path: Path | None = None
    generated_media_covers_loop_count: bool = False


class VideoEditingPipeline:
    """视频剪辑管线，按 PRD 第 6 节顺序执行所有编辑步骤。

    管线内部创建并管理所有处理模块，调用方只需传入上下文数据。
    输出视频写入 dirs.output_dir 下的 task_{task_id}_output.mp4。

    属性:
        _logger: 日志记录器
    """

    def __init__(self, logger: "Logger | None" = None) -> None:
        self._logger = logger

    def run(self, ctx: PipelineContext) -> Path:
        """执行剪辑管线。

        参数:
            ctx: 管线上下文，包含任务、配置、素材索引等
        返回:
            最终输出视频路径
        抛出:
            PipelineError: 任一编辑步骤失败时抛出
        """
        output_path = ctx.dirs.output_dir / "video_1.mp4"
        ctx.dirs.output_dir.mkdir(parents=True, exist_ok=True)

        frame_randomizer = self._build_frame_randomizer(ctx)
        audio_processor = self._build_audio_processor(ctx)
        audio_filters, audio_inputs = audio_processor.build(
            bgm_dir=str(ctx.dirs.bgm_dir),
        )

        video_filters = frame_randomizer.build_filters()
        if ctx.extra_video_filters:
            video_filters.extend(ctx.extra_video_filters)
        loop_count = getattr(ctx.user_config.repetition, "loop_count", 1)

        audio_inputs = list(audio_inputs)  # 避免修改调用方原始列表
        if ctx.extra_audio_inputs:
            audio_inputs.extend(ctx.extra_audio_inputs)

        affixer = VideoAffixer(
            prepend_dir=ctx.dirs.prepend_dir,
            append_dir=ctx.dirs.append_dir,
            logger=ctx.logger,
        )

        if ctx.task.mode == "image-to-video":
            pre_affix_path = self._run_image_to_video(
                ctx, video_filters, audio_filters, audio_inputs, loop_count,
            )
            target_size = None
        else:
            pre_affix_path, target_size = self._run_reference_video(
                ctx, video_filters, audio_filters, audio_inputs, loop_count,
            )

        try:
            result = affixer.prepend_append(
                pre_affix_path, output_path, target_size=target_size,
            )
            final_path = result.output_path
        except Exception as e:
            raise PipelineError("前后贴拼接失败: %s" % e) from e

        # 确保输出落到指定的 output_dir：当 VideoAffixer 无前后贴资源时
        # 直接返回临时文件路径而非目标 output_path，需要复制/移动到正确位置
        if final_path != output_path and final_path.exists():
            output_path.unlink(missing_ok=True)
            shutil.copy2(str(final_path), str(output_path))
            final_path = output_path

        if ctx.logger:
            ctx.logger.info(
                task_id=ctx.task.id,
                module="剪辑管线",
                message="管线完成: %s" % final_path,
            )

        return final_path

    # ── 内部：模块构建 ──

    def _build_frame_randomizer(self, ctx: PipelineContext) -> FrameRandomizer:
        uc = ctx.user_config
        rng_frame = ctx.local_config.randomization.frame
        return FrameRandomizer(
            config=FrameRandomizationConfig(
                drop_frame=uc.video_items.frame_extraction,
                crop=uc.video_items.cropping,
                blur=uc.video_items.blur,
                shake=uc.video_items.shake,
                brightness=uc.video_items.brightness,
                contrast=uc.video_items.contrast,
                saturation=uc.video_items.saturation,
                color_balance=uc.video_items.color_balance,
                gamma=uc.video_items.gamma,
                vintage_bw=uc.video_items.vintage_bw,
            ),
            range_config=rng_frame,
            rng=random.Random(),
            logger=ctx.logger,
        )

    def _build_audio_processor(self, ctx: PipelineContext) -> AudioProcessor:
        uc = ctx.user_config
        audio_range = ctx.local_config.randomization.audio
        return AudioProcessor(
            config=AudioProcessingConfig(
                background_music=uc.audio.background_music_enabled,
                speed_adjustment=uc.audio.speed_adjustment_enabled,
                pitch_enabled=uc.audio.pitch_enabled,
            ),
            logger=ctx.logger,
            formats_config=ctx.local_config.randomization.media_formats,
            random_config=audio_range,
        )

    def _build_overlay_elements(
        self,
        ctx: PipelineContext,
        video_width: int = 1920,
        video_height: int = 1080,
        video_duration_sec: float = 30.0,
    ) -> tuple[list[str], list[str]]:
        """根据服务端配置和本地素材目录构建水印/贴纸叠加滤镜。

        参数:
            ctx: 管线上下文
            video_width/video_height: 视频分辨率
            video_duration_sec: 视频时长（用于弹幕密度计算）
        返回:
            (overlay_filters, overlay_inputs) 元组
        """
        uc = ctx.user_config
        no_watermark = not uc.video_items.watermark
        no_sticker = not uc.text_items.sticker_enabled
        if no_watermark and no_sticker:
            return [], []

        overlay_config = OverlayConfig(
            watermark_enabled=uc.video_items.watermark,
            subtitle_enabled=False,
            danmaku_enabled=False,
            sticker_enabled=uc.text_items.sticker_enabled,
        )
        builder = OverlayElementBuilder(
            config=overlay_config,
            watermark_dir=str(ctx.dirs.watermark_dir) if ctx.dirs.watermark_dir.name != "NONEXISTENT" else None,
            sticker_dir=str(ctx.dirs.sticker_dir) if ctx.dirs.sticker_dir.name != "NONEXISTENT" else None,
            rng=random.Random(),
            logger=ctx.logger,
            range_config=ctx.local_config.randomization.overlay,
        )
        builder.set_video_info(video_width, video_height, video_duration_sec)
        return builder.build(video_base_label="v_base")

    # ── 内部：图生视频管线 ──

    def _run_image_to_video(
        self,
        ctx: PipelineContext,
        video_filters: list[str],
        audio_filters: list[str],
        audio_inputs: list[str],
        loop_count: int,
    ) -> Path:
        """图生视频模式：图片→视频→效果→叠加。

        步骤:
            1. 图片拼接 → 基础无声视频
            2. 注入静音音频轨
            3. 应用视频效果 + BGM 混音
            返回前置处理后的视频路径（供前后贴拼接使用）
        """
        images = [m.path for m in ctx.material_index.images]
        if not images:
            raise PipelineError("图生视频模式需要至少一张图片素材")

        temp_dir = ctx.scratch_dir / "img2vid"
        temp_dir.mkdir(parents=True, exist_ok=True)

        conv_config = ConversionConfig(
            duration_per_image=getattr(
                ctx.user_config.clip_duration, "default_duration_per_image", 5.0,
            ),
            transition=self._build_transition_config(ctx),
        )

        # 步骤 1：图片 → 基础无声视频
        silent_path = temp_dir / "_silent.mp4"
        converter = VideoConverter(logger=ctx.logger)
        try:
            converter.images_to_video(images, silent_path, conv_config)
        except Exception as e:
            raise PipelineError("图片转视频失败: %s" % e) from e

        # 步骤 2：注入静音轨
        with_audio_path = temp_dir / "_with_silence.mp4"
        self._inject_silent_audio(silent_path, with_audio_path)

        # 步骤 3：视频效果 + BGM
        pre_affix_path = temp_dir / "_pre_affix.mp4"
        overlay_filters, overlay_inputs = self._build_overlay_elements(ctx)
        processor = ReferenceVideoProcessor(logger=ctx.logger)
        try:
            processor.process(
                reference_video=with_audio_path,
                output_path=pre_affix_path,
                video_filters=video_filters,
                overlay_filters=overlay_filters,
                overlay_inputs=overlay_inputs,
                audio_filters=audio_filters,
                audio_inputs=audio_inputs,
                loop_count=loop_count,
                subtitle_srt_path=ctx.subtitle_srt_path,
                replacement_audio_path=ctx.replacement_audio_path,
                repeat_subtitle_and_replacement_audio=not ctx.generated_media_covers_loop_count,
            )
        except Exception as e:
            raise PipelineError("视频效果处理失败: %s" % e) from e

        return pre_affix_path

    def _inject_silent_audio(self, input_path: Path, output_path: Path) -> None:
        """为无声视频注入静音音频轨。

        使用 ffmpeg anullsrc 生成静音声道，再混入视频。

        参数:
            input_path: 无声视频路径
            output_path: 带静音轨的视频输出路径
        抛出:
            PipelineError: FFmpeg 失败时抛出
        """
        cmd = [
            ffmpeg_path(), "-y",
            "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-i", str(input_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path),
        ]
        result = _run_no_window(
            cmd, capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )
        if result.returncode != 0:
            raise PipelineError(
                "静音轨注入失败: %s" % (result.stderr or "").strip(),
            )

    def _build_transition_config(self, ctx: PipelineContext) -> TransitionConfig | None:
        clip_mode = ctx.user_config.clip_mode
        if not getattr(clip_mode, "transition_enabled", False):
            return None
        transition_types = getattr(clip_mode, "transition_types", None)
        return TransitionConfig(
            enabled=True,
            duration=float(getattr(clip_mode, "transition_duration", 0.5)),
            types=list(transition_types) if transition_types else None,
        )

    # ── 内部：参考生视频管线 ──

    def _run_reference_video(
        self,
        ctx: PipelineContext,
        video_filters: list[str],
        audio_filters: list[str],
        audio_inputs: list[str],
        loop_count: int,
    ) -> tuple[Path, tuple[int, int] | None]:
        """参考生视频模式：图片视频拼接→效果→叠加。

        步骤:
            1. 素材图片与参考视频拼接（含降级策略），位置为 none 时跳过
            2. 视频效果 + BGM
        返回:
            (前置处理后的视频路径, 参考视频分辨率(width,height))
        """
        videos = [m.path for m in ctx.material_index.videos]
        if not videos:
            raise PipelineError("参考生视频模式需要至少一个参考视频")

        reference_video = videos[0]
        target_size = self._probe_resolution(reference_video)

        if ctx.logger:
            ctx.logger.info(
                task_id=ctx.task.id,
                module="剪辑管线",
                message="参考视频分辨率: %dx%d" % target_size,
            )

        temp_dir = ctx.scratch_dir / "refvid"
        temp_dir.mkdir(parents=True, exist_ok=True)

        img_position = getattr(
            ctx.user_config.clip_mode, "img_video_position", "after",
        )

        if img_position == "none":
            base_video = reference_video
            if ctx.logger:
                ctx.logger.info(
                    task_id=ctx.task.id,
                    module="图片视频拼接",
                    message="img_video_position=none，跳过图片拼接",
                )
        else:
            img_dir = ctx.dirs.img_dir
            concat_config = ImageConcatConfig(
                img_video_position=img_position,
                image_duration=getattr(
                    ctx.user_config.clip_duration, "default_duration_per_image", 5.0,
                ),
            )
            concat_processor = ReferenceVideoConcatProcessor(logger=ctx.logger)
            merged_path = temp_dir / "_merged.mp4"
            try:
                base_video = concat_processor.process(
                    task_id=ctx.task.id,
                    img_dir=img_dir,
                    reference_video=reference_video,
                    output_path=merged_path,
                    config=concat_config,
                    target_size=target_size,
                )
            except Exception as e:
                raise PipelineError("图片视频拼接失败: %s" % e) from e

        pre_affix_path = temp_dir / "_pre_affix.mp4"
        overlay_filters, overlay_inputs = self._build_overlay_elements(ctx)
        processor = ReferenceVideoProcessor(logger=ctx.logger)
        try:
            processor.process(
                reference_video=base_video,
                output_path=pre_affix_path,
                video_filters=video_filters,
                overlay_filters=overlay_filters,
                overlay_inputs=overlay_inputs,
                audio_filters=audio_filters,
                audio_inputs=audio_inputs,
                loop_count=loop_count,
                subtitle_srt_path=ctx.subtitle_srt_path,
                replacement_audio_path=ctx.replacement_audio_path,
                repeat_subtitle_and_replacement_audio=not ctx.generated_media_covers_loop_count,
            )
        except Exception as e:
            raise PipelineError("视频效果处理失败: %s" % e) from e

        return pre_affix_path, OUTPUT_SIZE

    @staticmethod
    def _probe_resolution(video_path: Path) -> tuple[int, int]:
        result = _run_no_window(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_entries", "stream=width,height",
             "-select_streams", "v:0", str(video_path)],
            capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )
        if result.returncode == 0:
            try:
                info = json.loads(result.stdout)
                for stream in info.get("streams", []):
                    w = stream.get("width", 0)
                    h = stream.get("height", 0)
                    if w and h:
                        return (int(w), int(h))
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        return (1920, 1080)
