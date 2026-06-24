from pathlib import Path
from unittest.mock import MagicMock, patch

from video_batch.video_converter import (
    ConversionConfig,
    ConversionError,
    TransitionConfig,
    VideoConverter,
)


def _mock_run(returncode: int = 0, stderr: str = ""):
    result = MagicMock()
    result.returncode = returncode
    result.stderr = stderr
    return result


def test_single_image_conversion_calls_ffmpeg(tmp_path):
    """单张图片调用 FFmpeg 生成视频，返回输出路径"""
    img = tmp_path / "img.jpg"
    img.write_text("fake")
    output = tmp_path / "output.mp4"

    config = ConversionConfig(duration_per_image=5.0)

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        result = converter.images_to_video(
            images=[img], output_path=output, config=config,
        )

    assert result == output
    args = mock_run.call_args[0][0]
    assert "ffmpeg" in args[0]
    assert "-y" in args


def test_single_image_output_uses_vertical_canvas_and_bitrate(tmp_path):
    """单张图片输出为 1080x1920 竖版，并设置视频码率下限"""
    img = tmp_path / "img.jpg"
    img.write_text("fake")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        converter.images_to_video(
            images=[img], output_path=output, config=ConversionConfig(),
        )

    args = mock_run.call_args[0][0]
    cmd_str = " ".join(args)
    assert "scale=1080:1920:force_original_aspect_ratio=decrease" in cmd_str
    assert "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" in cmd_str
    assert "fps=30" in cmd_str
    assert "-b:v" in args
    assert args[args.index("-b:v") + 1] == "800k"
    assert "-minrate" in args
    assert args[args.index("-minrate") + 1] == "516k"


def test_output_dir_is_created_automatically(tmp_path):
    """输出目录不存在时自动创建"""
    img = tmp_path / "img.jpg"
    img.write_text("fake")
    output_dir = tmp_path / "nested" / "output"
    output = output_dir / "video.mp4"

    config = ConversionConfig()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        converter.images_to_video(images=[img], output_path=output, config=config)

    assert output_dir.exists()


def test_multiple_images_concat(tmp_path):
    """多张图片使用 concat 方式拼接"""
    from PIL import Image

    img1 = tmp_path / "a.jpg"
    img2 = tmp_path / "b.jpg"
    Image.new("RGB", (320, 240), color=(128, 128, 255)).save(img1, "JPEG")
    Image.new("RGB", (320, 240), color=(255, 128, 128)).save(img2, "JPEG")
    output = tmp_path / "output.mp4"

    config = ConversionConfig(duration_per_image=3.0)

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        converter.images_to_video(
            images=[img1, img2], output_path=output, config=config,
        )

    assert mock_run.call_count == 1


def test_multiple_images_use_independent_inputs_for_mixed_formats(tmp_path):
    """多图无转场时逐张读取图片，避免 concat demuxer 按首图编码误解码后续图片"""
    from PIL import Image

    img1 = tmp_path / "a.jpg"
    img2 = tmp_path / "b.png"
    Image.new("RGB", (320, 240), color=(128, 128, 255)).save(img1, "JPEG")
    Image.new("RGB", (320, 240), color=(255, 128, 128)).save(img2, "PNG")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        converter.images_to_video(
            images=[img1, img2],
            output_path=output,
            config=ConversionConfig(duration_per_image=3.0),
        )

    args = mock_run.call_args[0][0]
    assert "-f" not in args
    assert "concat=n=2:v=1:a=0[vout]" in " ".join(args)
    assert args.count("-loop") == 2
    assert str(img1) in args
    assert str(img2) in args


def test_multiple_images_output_uses_vertical_canvas(tmp_path):
    """多张图片输出统一缩放到 1080x1920 画布并补黑边"""
    from PIL import Image

    img1 = tmp_path / "a.jpg"
    img2 = tmp_path / "b.png"
    Image.new("RGB", (320, 240), color=(128, 128, 255)).save(img1, "JPEG")
    Image.new("RGB", (240, 320), color=(255, 128, 128)).save(img2, "PNG")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        converter.images_to_video(
            images=[img1, img2],
            output_path=output,
            config=ConversionConfig(duration_per_image=3.0),
        )

    cmd_str = " ".join(mock_run.call_args[0][0])
    assert cmd_str.count("scale=1080:1920:force_original_aspect_ratio=decrease") == 2
    assert cmd_str.count("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black") == 2


def test_transition_enabled_uses_xfade_filter(tmp_path):
    """开启随机转场时使用 xfade 滤镜链"""
    from PIL import Image

    img1 = tmp_path / "a.jpg"
    img2 = tmp_path / "b.jpg"
    Image.new("RGB", (320, 240), color=(128, 128, 255)).save(img1, "JPEG")
    Image.new("RGB", (640, 480), color=(255, 128, 128)).save(img2, "JPEG")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        converter.images_to_video(
            images=[img1, img2],
            output_path=output,
            config=ConversionConfig(
                duration_per_image=3.0,
                transition=TransitionConfig(
                    enabled=True,
                    duration=0.5,
                    types=["fade"],
                ),
            ),
        )

    args = mock_run.call_args[0][0]
    cmd_str = " ".join(args)
    assert "xfade=transition=fade" in cmd_str
    assert "concat=n=" not in cmd_str


def test_transition_output_uses_vertical_canvas(tmp_path):
    """转场图片输出统一缩放到 1080x1920 画布并补黑边"""
    from PIL import Image

    img1 = tmp_path / "a.jpg"
    img2 = tmp_path / "b.jpg"
    Image.new("RGB", (320, 240), color=(128, 128, 255)).save(img1, "JPEG")
    Image.new("RGB", (640, 480), color=(255, 128, 128)).save(img2, "JPEG")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter()
        converter.images_to_video(
            images=[img1, img2],
            output_path=output,
            config=ConversionConfig(
                transition=TransitionConfig(
                    enabled=True,
                    duration=0.5,
                    types=["fade"],
                ),
            ),
        )

    cmd_str = " ".join(mock_run.call_args[0][0])
    assert cmd_str.count("scale=1080:1920:force_original_aspect_ratio=decrease") == 2
    assert cmd_str.count("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black") == 2


def test_ffmpeg_failure_raises_conversion_error(tmp_path):
    """FFmpeg 非零退出码抛出 ConversionError"""
    img = tmp_path / "img.jpg"
    img.write_text("fake")
    output = tmp_path / "out.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(1, stderr="encoder error")
        converter = VideoConverter()

        try:
            converter.images_to_video(
                images=[img], output_path=output, config=ConversionConfig(),
            )
            assert False, "should have raised"
        except ConversionError as e:
            assert "encoder error" in str(e)


def test_conversion_logs_key_events(tmp_path):
    """关键流程记录日志"""
    img = tmp_path / "img.jpg"
    img.write_text("fake")
    output = tmp_path / "out.mp4"
    logger = MagicMock()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        converter = VideoConverter(logger=logger)
        converter.images_to_video(
            images=[img], output_path=output, config=ConversionConfig(),
        )

    logger.info.assert_called()


def test_real_ffmpeg_integration(tmp_path):
    """真实 FFmpeg 集成测试：最小 JPEG → H.264 视频"""
    from PIL import Image

    img = tmp_path / "test.jpg"
    img_obj = Image.new("RGB", (320, 240), color=(128, 128, 255))
    img_obj.save(img, "JPEG")

    output = tmp_path / "out.mp4"
    converter = VideoConverter()
    result = converter.images_to_video(
        images=[img], output_path=output,
        config=ConversionConfig(duration_per_image=1.0),
    )

    assert result.exists()
    assert result.stat().st_size > 1000
    assert result.suffix == ".mp4"


def test_real_ffmpeg_mixed_image_formats(tmp_path):
    """真实 FFmpeg 下混合 JPEG/PNG 图片也能生成视频"""
    from PIL import Image

    jpg = tmp_path / "a.jpg"
    png = tmp_path / "b.png"
    Image.new("RGB", (320, 240), color=(128, 128, 255)).save(jpg, "JPEG")
    Image.new("RGB", (320, 240), color=(255, 128, 128)).save(png, "PNG")

    output = tmp_path / "mixed.mp4"
    converter = VideoConverter()
    result = converter.images_to_video(
        images=[jpg, png],
        output_path=output,
        config=ConversionConfig(duration_per_image=0.5),
    )

    assert result.exists()
    assert result.stat().st_size > 1000


def test_real_ffmpeg_mixed_image_sizes(tmp_path):
    """真实 FFmpeg 下不同尺寸图片会先统一画布再拼接"""
    from PIL import Image

    img1 = tmp_path / "small.jpg"
    img2 = tmp_path / "large.jpg"
    Image.new("RGB", (800, 800), color=(128, 128, 255)).save(img1, "JPEG")
    Image.new("RGB", (1280, 1280), color=(255, 128, 128)).save(img2, "JPEG")

    output = tmp_path / "mixed_sizes.mp4"
    converter = VideoConverter()
    result = converter.images_to_video(
        images=[img1, img2],
        output_path=output,
        config=ConversionConfig(duration_per_image=0.5),
    )

    assert result.exists()
    assert result.stat().st_size > 1000
