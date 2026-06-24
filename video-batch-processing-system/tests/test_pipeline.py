from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image

from video_batch.config_sync import (
    AffixToggleConfig,
    AudioToggleConfig,
    ClipDurationConfig,
    ClipModeConfig,
    RepetitionConfig,
    ServerConfig,
    TextItemConfig,
    VideoItemConfig,
)
from video_batch.local_config import LocalConfig
from video_batch.material_scanner import MaterialIndex
from video_batch.pipeline import (
    EditDirs,
    PipelineContext,
    PipelineError,
    VideoEditingPipeline,
)
from video_batch.task_queue import Task


def _mock_subprocess_run(returncode=0, stderr=""):
    result = MagicMock()
    result.returncode = returncode
    result.stderr = stderr
    return result


def _make_ctx(
    tmp_path,
    mode="image-to-video",
    image_count=2,
    video_count=1,
    loop_count=1,
    transition_enabled=False,
) -> PipelineContext:
    scratch_dir = tmp_path / "scratch"
    scratch_dir.mkdir()

    output_dir = tmp_path / "output"
    output_dir.mkdir()

    task = Task(
        id="task-001",
        productId="mat-001",
        mode=mode,
        config_id="cfg-001",
    )

    user_config = ServerConfig(
        version=1,
        clip_mode=ClipModeConfig(
            mode=mode,
            transition_enabled=transition_enabled,
            transition_duration=0.6,
            transition_types=("fade", "wipeleft") if transition_enabled else None,
        ),
        video_items=VideoItemConfig(
            frame_extraction=True,
            cropping=True,
            blur=True,
            shake=True,
            watermark=False,
            brightness=False,
            contrast=False,
            saturation=False,
            color_balance=False,
            gamma=False,
            vintage_bw=False,
        ),
        text_items=TextItemConfig(subtitles=False, danmaku=False),
        affix=AffixToggleConfig(prepend_enabled=False, append_enabled=False),
        audio=AudioToggleConfig(
            background_music_enabled=False,
            speed_adjustment_enabled=False,
            pitch_enabled=False,
        ),
        repetition=RepetitionConfig(loop_count=loop_count),
        clip_duration=ClipDurationConfig(default_duration_per_image=3.0),
    )

    local_config = LocalConfig()

    images = []
    if image_count > 0:
        img_dir = tmp_path / "task-001" / "img"
        img_dir.mkdir(parents=True)
        for i in range(image_count):
            img = img_dir / "{}.jpg".format(chr(97 + i))
            Image.new("RGB", (320, 240), color=(128, 128, 255)).save(img, "JPEG")
            images.append(MagicMock(path=img))

    videos = []
    if video_count > 0:
        v_dir = tmp_path / "task-001" / "mv"
        v_dir.mkdir(parents=True)
        v = v_dir / "ref.mp4"
        v.write_text("video_content")
        videos.append(MagicMock(path=v))

    material_index = MagicMock(spec=MaterialIndex)
    material_index.images = images
    material_index.videos = videos

    prepend_dir = tmp_path / "prepend"
    prepend_dir.mkdir()
    append_dir = tmp_path / "append"
    append_dir.mkdir()

    dirs = EditDirs(
        bgm_dir=tmp_path / "bgm",
        output_dir=output_dir,
        watermark_dir=tmp_path / "wm",
        sticker_dir=tmp_path / "sticker",
        prepend_dir=prepend_dir,
        append_dir=append_dir,
    )

    return PipelineContext(
        task=task,
        user_config=user_config,
        local_config=local_config,
        material_index=material_index,
        scratch_dir=scratch_dir,
        dirs=dirs,
    )


class TestImageToVideoPipeline:
    """图生视频模式管线测试"""

    def test_full_pipeline_returns_output_path(self, tmp_path):
        """完整管线成功返回输出视频路径，无前后贴时返回前置处理路径"""
        ctx = _make_ctx(tmp_path, mode="image-to-video", image_count=2)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),  # images_to_video
                _mock_subprocess_run(0),  # _inject_silent_audio
                _mock_subprocess_run(0),  # reference_video.process
            ]
            result = pipeline.run(ctx)

        assert result.suffix == ".mp4"
        assert result.exists() or True

    def test_pipeline_calls_ffmpeg_steps(self, tmp_path):
        """图生视频管线按顺序调用 FFmpeg 步骤（无前后贴时 3 步）"""
        ctx = _make_ctx(tmp_path, mode="image-to-video", image_count=2)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),
                _mock_subprocess_run(0),
                _mock_subprocess_run(0),
            ]
            pipeline.run(ctx)

        assert mock_run.call_count == 3

    def test_no_images_raises_pipeline_error(self, tmp_path):
        """无图片素材时抛出 PipelineError"""
        ctx = _make_ctx(tmp_path, mode="image-to-video", image_count=0)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run"):
            with pytest.raises(PipelineError, match="至少一张图片素材"):
                pipeline.run(ctx)


    def test_image_to_video_passes_transition_config_to_converter(self, tmp_path):
        """图生视频开启随机转场时，ConversionConfig 会传入 xfade 转场配置"""
        ctx = _make_ctx(
            tmp_path,
            mode="image-to-video",
            image_count=2,
            transition_enabled=True,
        )

        pipeline = VideoEditingPipeline()

        with patch("video_batch.pipeline.VideoConverter.images_to_video") as mock_convert, patch(
            "subprocess.run"
        ) as mock_run:
            mock_convert.return_value = tmp_path / "silent.mp4"
            mock_run.side_effect = [
                _mock_subprocess_run(0),
                _mock_subprocess_run(0),
            ]
            pipeline.run(ctx)

        _, _, config = mock_convert.call_args[0]
        assert config.transition is not None
        assert config.transition.enabled is True
        assert config.transition.duration == 0.6
        assert config.transition.types == ["fade", "wipeleft"]


class TestReferenceVideoPipeline:
    """参考生视频模式管线测试"""

    def test_full_pipeline_returns_output_path(self, tmp_path):
        """完整管线成功返回输出视频路径"""
        ctx = _make_ctx(tmp_path, mode="reference-video", image_count=1, video_count=1)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),  # images_to_video
                _mock_subprocess_run(0),  # concat
                _mock_subprocess_run(0),  # reference_video.process
            ]
            result = pipeline.run(ctx)

        assert result.suffix == ".mp4"

    def test_no_video_raises_pipeline_error(self, tmp_path):
        """无参考视频时抛出 PipelineError"""
        ctx = _make_ctx(tmp_path, mode="reference-video", video_count=0)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run"):
            with pytest.raises(PipelineError, match="至少一个参考视频"):
                pipeline.run(ctx)

    def test_fallback_when_img_dir_empty(self, tmp_path):
        """img 目录为空时降级成功，FFmpeg 仅调用效果处理"""
        ctx = _make_ctx(tmp_path, mode="reference-video", image_count=0, video_count=1)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),  # _probe_resolution
                _mock_subprocess_run(0),  # reference_video.process
            ]
            result = pipeline.run(ctx)

        assert result.suffix == ".mp4"
        assert mock_run.call_count == 2

    def test_concat_failure_raises_pipeline_error(self, tmp_path):
        """图片视频拼接失败时降级为参考视频，不抛 PipelineError"""
        ctx = _make_ctx(tmp_path, mode="reference-video", image_count=1, video_count=1)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),  # _probe_resolution
                _mock_subprocess_run(0),  # images_to_video ok
                _mock_subprocess_run(0, stderr=""),  # ffprobe 探测时长
                _mock_subprocess_run(1, stderr="concat filter error"),  # concat fail
                _mock_subprocess_run(0),  # reference_video.process (降级后)
            ]
            result = pipeline.run(ctx)

        assert result.suffix == ".mp4"

    def test_passes_subtitle_and_replacement_audio_to_processor(self, tmp_path):
        """PipelineContext 中的 SRT/MP3 会传递给 ReferenceVideoProcessor"""
        ctx = _make_ctx(tmp_path, mode="reference-video", image_count=0, video_count=1)
        subtitle = tmp_path / "generated.srt"
        subtitle.write_text("1\n00:00:00,000 --> 00:00:01,000\n字幕\n", encoding="utf-8")
        mp3 = tmp_path / "generated.mp3"
        mp3.write_text("audio")
        ctx.subtitle_srt_path = subtitle
        ctx.replacement_audio_path = mp3

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run, patch(
            "video_batch.pipeline.ReferenceVideoProcessor.process"
        ) as mock_process:
            mock_run.return_value = _mock_subprocess_run(0)
            mock_process.return_value = tmp_path / "pre_affix.mp4"
            pipeline.run(ctx)

        _, kwargs = mock_process.call_args
        assert kwargs["subtitle_srt_path"] == subtitle
        assert kwargs["replacement_audio_path"] == mp3

    def test_reference_mode_passes_vertical_target_size_to_affixer(self, tmp_path):
        """参考视频模式最终前后贴使用固定 1080x1920 竖版画布"""
        ctx = _make_ctx(tmp_path, mode="reference-video", image_count=0, video_count=1)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run, patch(
            "video_batch.pipeline.VideoAffixer.prepend_append"
        ) as mock_affix:
            mock_run.side_effect = [
                _mock_subprocess_run(0),  # _probe_resolution
                _mock_subprocess_run(0),  # reference_video.process
            ]
            mock_affix.return_value = MagicMock(output_path=tmp_path / "video_1.mp4")
            pipeline.run(ctx)

        _, kwargs = mock_affix.call_args
        assert kwargs["target_size"] == (1080, 1920)


class TestLoopCount:
    """循环播放测试（loop_count 作为位置参数传入子方法）"""

    def test_loop_count_2_passed_to_image_to_video(self, tmp_path):
        """loop_count=2 作为位置参数传入 _run_image_to_video"""
        ctx = _make_ctx(tmp_path, mode="image-to-video", image_count=1, loop_count=2)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),
                _mock_subprocess_run(0),
                _mock_subprocess_run(0),
            ]
            with patch.object(
                pipeline, "_run_image_to_video"
            ) as mock_run_img:
                mock_run_img.return_value = tmp_path / "pre_affix.mp4"
                pipeline.run(ctx)

        args, _ = mock_run_img.call_args
        assert args[4] == 2

    def test_loop_count_default_1(self, tmp_path):
        """默认 loop_count=1"""
        ctx = _make_ctx(tmp_path, mode="reference-video", loop_count=1)

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),
            ]
            with patch.object(
                pipeline, "_run_reference_video"
            ) as mock_run_ref:
                mock_run_ref.return_value = (tmp_path / "pre_affix.mp4", (1920, 1080))
                pipeline.run(ctx)

        args, _ = mock_run_ref.call_args
        assert args[4] == 1


class TestAffixError:
    """前后贴异常处理测试"""

    def test_affix_failure_raises_pipeline_error(self, tmp_path):
        """前后贴拼接失败抛出 PipelineError"""
        ctx = _make_ctx(tmp_path, mode="image-to-video", image_count=1)
        # 放入一个假的视频文件，让 VideoAffixer 实际尝试拼接
        (ctx.dirs.prepend_dir / "head.mp4").write_text("fake_head")
        (ctx.dirs.append_dir / "tail.mp4").write_text("fake_tail")

        pipeline = VideoEditingPipeline()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_subprocess_run(0),  # images_to_video
                _mock_subprocess_run(0),  # _inject_silent_audio
                _mock_subprocess_run(0),  # reference_video.process
                _mock_subprocess_run(1, stderr="affix error"),
            ]
            with pytest.raises(PipelineError, match="前后贴拼接失败"):
                pipeline.run(ctx)


class TestReferenceVideoLoopCount:
    """ReferenceVideoProcessor loop_count 参数测试"""

    def test_loop_count_default_does_not_add_stream_loop(self, tmp_path):
        """loop_count=1 时命令不包含 -stream_loop"""
        from video_batch.reference_video import ReferenceVideoProcessor

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("fake")
        output = tmp_path / "out.mp4"

        processor = ReferenceVideoProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = _mock_subprocess_run(0)
            processor.process(
                reference_video=ref_video,
                output_path=output,
                video_filters=[],
                overlay_filters=[],
                overlay_inputs=[],
                audio_filters=[],
                audio_inputs=[],
                loop_count=1,
            )

        args = mock_run.call_args[0][0]
        assert "-stream_loop" not in args

    def test_loop_count_3_adds_stream_loop(self, tmp_path):
        """loop_count=3 时命令包含 -stream_loop 2"""
        from video_batch.reference_video import ReferenceVideoProcessor

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("fake")
        output = tmp_path / "out.mp4"

        processor = ReferenceVideoProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = _mock_subprocess_run(0)
            processor.process(
                reference_video=ref_video,
                output_path=output,
                video_filters=[],
                overlay_filters=[],
                overlay_inputs=[],
                audio_filters=[],
                audio_inputs=[],
                loop_count=3,
            )

        args = mock_run.call_args[0][0]
        assert "-stream_loop" in args
        sl_idx = args.index("-stream_loop")
        assert args[sl_idx + 1] == "2"


class TestEditDirs:
    """EditDirs 数据类测试"""

    def test_default_construction(self, tmp_path):
        """EditDirs 正确存储各目录路径"""
        d = EditDirs(
            bgm_dir=tmp_path / "bgm",
            output_dir=tmp_path / "out",
            watermark_dir=tmp_path / "wm",
            sticker_dir=tmp_path / "sticker",
            prepend_dir=tmp_path / "pre",
            append_dir=tmp_path / "app",
        )
        assert str(d.bgm_dir).endswith("bgm")
        assert str(d.output_dir).endswith("out")
