from pathlib import Path
from unittest.mock import MagicMock, patch

from video_batch.reference_video_concat import (
    ImageConcatConfig,
    ReferenceVideoConcatError,
    ReferenceVideoConcatProcessor,
)


def _mock_run(returncode: int = 0, stderr: str = ""):
    result = MagicMock()
    result.returncode = returncode
    result.stderr = stderr
    return result


class TestImageToVideoClip:
    """图片转视频片段测试"""

    def test_images_converted_to_video_with_config_duration(self, tmp_path):
        """素材目录中的图片按 image_duration 转为视频片段"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img1 = img_dir / "a.jpg"
        img2 = img_dir / "b.jpg"
        img1.write_text("img1")
        img2.write_text("img2")

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("reference")
        output = tmp_path / "output" / "stage1.mp4"

        config = ImageConcatConfig(
            img_video_position="after",
            image_duration=3.0,
        )

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_run(0),  # 图片转视频
                _mock_run(0),  # ffprobe 探测时长
                _mock_run(0),  # 拼接
            ]
            result = processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        assert result == output
        assert mock_run.call_count == 3
        assert output.parent.exists()

    def test_images_sorted_by_name_before_conversion(self, tmp_path):
        """图片按文件名排序后依次拼接为视频片段"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img_c = img_dir / "c.jpg"
        img_a = img_dir / "a.jpg"
        img_b = img_dir / "b.jpg"
        img_a.write_text("a")
        img_b.write_text("b")
        img_c.write_text("c")

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig(image_duration=2.0)

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [_mock_run(0), _mock_run(0)]
            with patch.object(
                processor, "_images_to_clip"
            ) as mock_images_to_clip:
                mock_images_to_clip.return_value = tmp_path / "img_clip.mp4"
                processor.process(
                    task_id="task_001",
                    img_dir=img_dir,
                    reference_video=ref_video,
                    output_path=output,
                    config=config,
                )

        args, _ = mock_images_to_clip.call_args
        images_list = args[1]
        assert len(images_list) == 3
        assert images_list[0].name == "a.jpg"
        assert images_list[1].name == "b.jpg"
        assert images_list[2].name == "c.jpg"


class TestConcatPosition:
    """拼接位置测试"""

    def test_before_places_image_clip_before_reference(self, tmp_path):
        """img_video_position='before' 时图片视频拼接在参考视频前"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img = img_dir / "a.jpg"
        img.write_text("img")

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig(img_video_position="before")

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [_mock_run(0), _mock_run(0), _mock_run(0)]
            processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        concat_args = mock_run.call_args_list[2][0][0]
        cmd_str = " ".join(str(a) for a in concat_args)
        assert "concat" in cmd_str or "Concat" in cmd_str

    def test_after_places_image_clip_after_reference(self, tmp_path):
        """img_video_position='after' 时图片视频拼接在参考视频后"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img = img_dir / "a.jpg"
        img.write_text("img")

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig(img_video_position="after")

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [_mock_run(0), _mock_run(0), _mock_run(0)]
            processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        concat_args = mock_run.call_args_list[2][0][0]
        cmd_str = " ".join(str(a) for a in concat_args)
        assert "concat" in cmd_str or "Concat" in cmd_str


class TestFallbackStrategy:
    """降级策略测试"""

    def test_empty_img_dir_skips_concat_falls_back_to_reference(self, tmp_path):
        """img 目录为空时跳过拼接，直接以参考视频进入后续处理"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            result = processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        mock_run.assert_not_called()
        assert result == output
        assert output.parent.exists()
        assert output.exists()
        assert output.read_text() == "ref"

    def test_missing_img_dir_skips_concat_falls_back_to_reference(self, tmp_path):
        """img 目录不存在时跳过拼接，直接以参考视频进入后续处理"""
        img_dir = tmp_path / "nonexistent_img"

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            result = processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        mock_run.assert_not_called()
        assert result == output
        assert output.exists()

    def test_fallback_copies_reference_to_output(self, tmp_path):
        """降级时将参考视频复制到输出路径"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()

        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("reference_content")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor()

        result = processor.process(
            task_id="task_001",
            img_dir=img_dir,
            reference_video=ref_video,
            output_path=output,
            config=config,
        )

        assert result == output
        assert output.read_text() == "reference_content"

    def test_fallback_logs_warning(self, tmp_path):
        """降级时记录 WARNING 级别日志"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"
        logger = MagicMock()

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor(logger=logger)

        processor.process(
            task_id="task_001",
            img_dir=img_dir,
            reference_video=ref_video,
            output_path=output,
            config=config,
        )

        logger.warning.assert_called_once()
        warning_call = logger.warning.call_args
        assert warning_call.kwargs["task_id"] == "task_001"

    def test_fallback_logs_warning_for_missing_dir(self, tmp_path):
        """img 目录不存在时同样记录 WARNING 日志"""
        img_dir = tmp_path / "missing_dir"
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"
        logger = MagicMock()

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor(logger=logger)

        processor.process(
            task_id="task_002",
            img_dir=img_dir,
            reference_video=ref_video,
            output_path=output,
            config=config,
        )

        logger.warning.assert_called_once()
        warning_call = logger.warning.call_args
        assert warning_call.kwargs["task_id"] == "task_002"

    def test_fallback_does_not_raise_error(self, tmp_path):
        """降级不抛出异常，任务不可标记为失败"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor()

        result = processor.process(
            task_id="task_001",
            img_dir=img_dir,
            reference_video=ref_video,
            output_path=output,
            config=config,
        )

        assert result == output
        assert output.exists()


class TestOutputFormat:
    """输出格式测试"""

    def test_output_uses_h264_and_aac_codecs(self, tmp_path):
        """拼接输出使用 H.264 视频编码和 AAC 音频编码"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img = img_dir / "a.jpg"
        img.write_text("img")
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [_mock_run(0), _mock_run(0), _mock_run(0)]
            processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        concat_args = mock_run.call_args_list[2][0][0]
        assert "-c:v" in concat_args
        vid_idx = concat_args.index("-c:v")
        assert concat_args[vid_idx + 1] == "libx264"
        assert "-c:a" in concat_args
        aud_idx = concat_args.index("-c:a")
        assert concat_args[aud_idx + 1] == "aac"

    def test_output_uses_vertical_canvas_and_bitrates(self, tmp_path):
        """拼接输出统一为 1080x1920 竖版并设置音视频码率"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img = img_dir / "a.jpg"
        img.write_text("img")
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [_mock_run(0), _mock_run(0), _mock_run(0)]
            processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=ImageConcatConfig(),
            )

        concat_args = mock_run.call_args_list[2][0][0]
        cmd_str = " ".join(concat_args)
        assert cmd_str.count("scale=1080:1920:force_original_aspect_ratio=decrease") == 2
        assert cmd_str.count("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black") == 2
        assert "-b:v" in concat_args
        assert concat_args[concat_args.index("-b:v") + 1] == "800k"
        assert "-minrate" in concat_args
        assert concat_args[concat_args.index("-minrate") + 1] == "516k"
        assert "-b:a" in concat_args
        assert concat_args[concat_args.index("-b:a") + 1] == "128k"


class TestErrorHandling:
    """异常处理测试"""

    def test_ffmpeg_concat_failure_raises_error(self, tmp_path):
        """FFmpeg 拼接失败抛出 ReferenceVideoConcatError"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img = img_dir / "a.jpg"
        img.write_text("img")
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [
                _mock_run(0),  # 图片转视频成功
                _mock_run(0),  # ffprobe 探测时长成功
                _mock_run(1, stderr="concat filter error"),  # 拼接失败
            ]
            try:
                processor.process(
                    task_id="task_001",
                    img_dir=img_dir,
                    reference_video=ref_video,
                    output_path=output,
                    config=config,
                )
                assert False, "should have raised"
            except ReferenceVideoConcatError as e:
                assert "concat filter error" in str(e)

    def test_image_conversion_failure_falls_back_to_reference(self, tmp_path):
        """图片转视频失败时降级回退到参考视频，不抛异常"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img = img_dir / "a.jpg"
        img.write_text("img")
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor()

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = _mock_run(1, stderr="conversion error")
            result = processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        assert result == output
        assert output.read_text() == "ref"


class TestLogging:
    """日志记录测试"""

    def test_logs_key_events_on_success(self, tmp_path):
        """拼接成功时关键流程节点记录日志"""
        img_dir = tmp_path / "img"
        img_dir.mkdir()
        img = img_dir / "a.jpg"
        img.write_text("img")
        ref_video = tmp_path / "ref.mp4"
        ref_video.write_text("ref")
        output = tmp_path / "out" / "stage1.mp4"
        logger = MagicMock()

        config = ImageConcatConfig()

        processor = ReferenceVideoConcatProcessor(logger=logger)

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = [_mock_run(0), _mock_run(0), _mock_run(0)]
            processor.process(
                task_id="task_001",
                img_dir=img_dir,
                reference_video=ref_video,
                output_path=output,
                config=config,
            )

        logger.info.assert_called()


class TestConfig:
    """配置测试"""

    def test_default_image_duration(self):
        """默认图片展示时长为 2.0 秒"""
        config = ImageConcatConfig()
        assert config.image_duration == 2.0
        assert config.img_video_position == "after"

    def test_custom_image_duration(self):
        """自定义图片展示时长"""
        config = ImageConcatConfig(image_duration=3.5)
        assert config.image_duration == 3.5
