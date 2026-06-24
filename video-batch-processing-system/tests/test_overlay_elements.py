import os
import random
from unittest.mock import MagicMock

from video_batch.overlay_elements import (
    AppliedOverlayParams, OverlayConfig, OverlayElementBuilder,
)


def test_all_disabled_returns_empty():
    """全部禁用时 build 返回空滤镜和空输入"""
    config = OverlayConfig(watermark_enabled=False, subtitle_enabled=False, danmaku_enabled=False)
    builder = OverlayElementBuilder(config=config, watermark_dir=".")

    filters, extra_inputs = builder.build()

    assert filters == []
    assert extra_inputs == []

    params = builder.get_applied_params()
    assert params.watermark_file is None
    assert params.watermark_transparency is None
    assert params.subtitle_text is None
    assert params.subtitle_font_size is None
    assert params.subtitle_color is None
    assert params.subtitle_x is None
    assert params.subtitle_y is None
    assert params.danmaku_texts is None
    assert params.danmaku_font_size is None
    assert params.danmaku_color is None
    assert params.danmaku_speed is None


def test_watermark_generates_overlay_filter(tmp_path):
    """水印启用：从目录随机选文件，生成带透明度和运动轨迹的 overlay 滤镜"""
    wm_dir = tmp_path / "wmarks"
    wm_dir.mkdir()
    (wm_dir / "logo_a.png").touch()
    (wm_dir / "logo_b.png").touch()

    config = OverlayConfig(watermark_enabled=True, subtitle_enabled=False, danmaku_enabled=False)
    rng = random.Random(42)
    builder = OverlayElementBuilder(config=config, watermark_dir=str(wm_dir), rng=rng)
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    assert len(extra_inputs) >= 2
    assert extra_inputs[0] == "-i"
    wm_path = extra_inputs[1]
    assert "logo_" in wm_path

    overlay_filter = next(f for f in filters if "overlay" in f)
    assert "shortest=1" not in overlay_filter
    assert "sin" in overlay_filter
    assert "cos" in overlay_filter

    params = builder.get_applied_params()
    assert params.watermark_file is not None
    assert params.watermark_transparency is not None
    assert 0.7 <= params.watermark_transparency <= 0.9
    assert params.watermark_motion_x_expr is not None
    assert params.watermark_motion_y_expr is not None


def test_subtitle_generates_drawtext_filter():
    """字幕启用：生成 drawtext 含随机字体/大小/颜色/位置"""
    config = OverlayConfig(watermark_enabled=False, subtitle_enabled=True, danmaku_enabled=False)
    rng = random.Random(42)
    builder = OverlayElementBuilder(config=config, rng=rng)
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    subtitle_filter = next(f for f in filters if "drawtext" in f)
    assert "drawtext" in subtitle_filter
    assert "fontsize=" in subtitle_filter
    assert "fontcolor=" in subtitle_filter
    assert ":x=" in subtitle_filter
    assert ":y=" in subtitle_filter

    params = builder.get_applied_params()
    assert params.subtitle_text is not None
    assert params.subtitle_font_size is not None
    assert 20 <= params.subtitle_font_size <= 40
    assert params.subtitle_color is not None
    assert params.subtitle_x is not None
    assert params.subtitle_y is not None


def test_danmaku_generates_scrolling_drawtext():
    """弹幕启用：生成滚动 drawtext，含随机速度和密度"""
    config = OverlayConfig(watermark_enabled=False, subtitle_enabled=False, danmaku_enabled=True)
    rng = random.Random(42)
    builder = OverlayElementBuilder(config=config, rng=rng)
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    danmaku_filters = [f for f in filters if "drawtext" in f]
    assert len(danmaku_filters) >= 1
    first = danmaku_filters[0]
    assert "drawtext" in first
    assert "fontsize=" in first

    params = builder.get_applied_params()
    assert params.danmaku_texts is not None
    assert len(params.danmaku_texts) >= 1


def test_same_seed_produces_same_result(tmp_path):
    """相同种子产生相同滤镜和输入"""
    wm_dir = tmp_path / "wmarks"
    wm_dir.mkdir()
    (wm_dir / "logo_a.png").touch()

    config = OverlayConfig()
    wm_dir_str = str(wm_dir)

    rng1 = random.Random(42)
    rng2 = random.Random(42)

    b1 = OverlayElementBuilder(config=config, watermark_dir=wm_dir_str, rng=rng1)
    b1.set_video_info(1920, 1080, 30.0)
    f1, i1 = b1.build()

    b2 = OverlayElementBuilder(config=config, watermark_dir=wm_dir_str, rng=rng2)
    b2.set_video_info(1920, 1080, 30.0)
    f2, i2 = b2.build()

    assert f1 == f2
    assert i1 == i2


def test_different_seeds_produce_different_filters(tmp_path):
    """不同种子产生不同结果"""
    wm_dir = tmp_path / "wmarks"
    wm_dir.mkdir()
    (wm_dir / "logo_a.png").touch()
    (wm_dir / "logo_b.png").touch()

    config = OverlayConfig(watermark_enabled=True, subtitle_enabled=True, danmaku_enabled=False)
    wm_dir_str = str(wm_dir)

    rng_a = random.Random(1)
    rng_b = random.Random(999)
    rng_a_copy = random.Random(1)

    b1 = OverlayElementBuilder(config=config, watermark_dir=wm_dir_str, rng=rng_a)
    b1.set_video_info(1920, 1080, 30.0)
    f1, _ = b1.build()

    b2 = OverlayElementBuilder(config=config, watermark_dir=wm_dir_str, rng=rng_b)
    b2.set_video_info(1920, 1080, 30.0)
    f2, _ = b2.build()

    b3 = OverlayElementBuilder(config=config, watermark_dir=wm_dir_str, rng=rng_a_copy)
    b3.set_video_info(1920, 1080, 30.0)
    f3, _ = b3.build()

    assert f1 != f2
    assert f1 == f3


def test_get_applied_params_matches_filters(tmp_path):
    """get_applied_params 返回与滤镜一致的参数"""
    wm_dir = tmp_path / "wmarks"
    wm_dir.mkdir()
    (wm_dir / "my_watermark.png").touch()

    config = OverlayConfig()
    rng = random.Random(42)
    builder = OverlayElementBuilder(config=config, watermark_dir=str(wm_dir), rng=rng)
    builder.set_video_info(1920, 1080, 30.0)

    _, _ = builder.build()
    params = builder.get_applied_params()

    assert params.watermark_file == "my_watermark.png"
    assert params.watermark_transparency is not None
    assert params.subtitle_font_size is not None


def test_logs_applied_params(tmp_path):
    """记录应用的叠加参数到日志"""
    wm_dir = tmp_path / "wmarks"
    wm_dir.mkdir()
    (wm_dir / "logo_a.png").touch()

    logger = MagicMock()
    config = OverlayConfig()
    rng = random.Random(42)
    builder = OverlayElementBuilder(
        config=config, watermark_dir=str(wm_dir), rng=rng, logger=logger,
    )
    builder.set_video_info(1920, 1080, 30.0)

    builder.build()

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "叠加" in call_args


def test_watermark_empty_dir_does_not_crash(tmp_path):
    """水印目录为空时不崩溃，不影响其他效果"""
    empty_dir = tmp_path / "empty_wm"
    empty_dir.mkdir()

    config = OverlayConfig(watermark_enabled=True, subtitle_enabled=True, danmaku_enabled=False)
    rng = random.Random(42)
    builder = OverlayElementBuilder(config=config, watermark_dir=str(empty_dir), rng=rng)
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    assert len(filters) >= 1
    subtitle = [f for f in filters if "drawtext" in f]
    assert len(subtitle) >= 1
    assert "drawtext" in subtitle[0]

    params = builder.get_applied_params()
    assert params.watermark_file is None
    assert params.subtitle_font_size is not None


def test_sticker_disabled_returns_no_sticker_filters(tmp_path):
    """贴纸禁用时 build 不产生贴纸相关滤镜"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "emoji.png").touch()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=False,
    )
    rng = random.Random(42)
    builder = OverlayElementBuilder(
        config=config, sticker_dir=str(sticker_dir), rng=rng,
    )
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    assert filters == []
    assert extra_inputs == []

    params = builder.get_applied_params()
    assert params.sticker_files is None
    assert params.sticker_count is None


def test_sticker_generates_overlay_filters(tmp_path):
    """贴纸启用：生成 format=rgba + colorchannelmixer + overlay 滤镜链"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "star.png").touch()
    (sticker_dir / "heart.webp").touch()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    rng = random.Random(42)
    builder = OverlayElementBuilder(
        config=config, sticker_dir=str(sticker_dir), rng=rng,
    )
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    assert len(filters) >= 1
    assert all("overlay" in f for f in filters)
    assert all("format=rgba" in f for f in filters)
    assert all("colorchannelmixer=aa=" in f for f in filters)

    assert len(extra_inputs) >= 2
    assert extra_inputs[0] == "-i"


def test_sticker_count_between_1_and_4(tmp_path):
    """贴纸数量在 1-4 范围内随机"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    for i in range(10):
        (sticker_dir / f"sticker_{i}.png").touch()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )

    all_counts = set()
    for seed in range(100):
        rng = random.Random(seed)
        builder = OverlayElementBuilder(
            config=config, sticker_dir=str(sticker_dir), rng=rng,
        )
        builder.set_video_info(1920, 1080, 30.0)
        filters, _ = builder.build()
        all_counts.add(len(filters))
        params = builder.get_applied_params()
        all_counts.add(params.sticker_count)

    assert 1 in all_counts
    assert 4 in all_counts
    assert min(all_counts) >= 1
    assert max(all_counts) <= 4


def test_sticker_transparency_in_range(tmp_path):
    """贴纸透明度在 0.7-0.9 范围内（对应 10%-30% 透明度）"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "emoji.png").touch()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )

    for seed in range(50):
        rng = random.Random(seed)
        builder = OverlayElementBuilder(
            config=config, sticker_dir=str(sticker_dir), rng=rng,
        )
        builder.set_video_info(1920, 1080, 30.0)
        builder.build()
        params = builder.get_applied_params()

        assert params.sticker_transparencies is not None
        for t in params.sticker_transparencies:
            assert 0.7 <= t <= 0.9, f"seed={seed} transparency={t} out of range"


def test_sticker_motion_has_sin_cos(tmp_path):
    """贴纸运动轨迹使用 sin/cos 表达式"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "emoji.png").touch()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    rng = random.Random(42)
    builder = OverlayElementBuilder(
        config=config, sticker_dir=str(sticker_dir), rng=rng,
    )
    builder.set_video_info(1920, 1080, 30.0)

    filters, _ = builder.build()

    for f in filters:
        assert "sin" in f or "cos" in f, f"filter missing motion: {f}"


def test_sticker_same_seed_produces_same_result(tmp_path):
    """相同种子产生相同的贴纸滤镜和输入"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    for i in range(5):
        (sticker_dir / f"s{i}.png").touch()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    sticker_dir_str = str(sticker_dir)

    rng1 = random.Random(42)
    rng2 = random.Random(42)

    b1 = OverlayElementBuilder(
        config=config, sticker_dir=sticker_dir_str, rng=rng1,
    )
    b1.set_video_info(1920, 1080, 30.0)
    f1, i1 = b1.build()

    b2 = OverlayElementBuilder(
        config=config, sticker_dir=sticker_dir_str, rng=rng2,
    )
    b2.set_video_info(1920, 1080, 30.0)
    f2, i2 = b2.build()

    assert f1 == f2
    assert i1 == i2


def test_sticker_applied_params_recorded(tmp_path):
    """贴纸参数正确记录到 AppliedOverlayParams"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "cat.png").touch()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    rng = random.Random(42)
    builder = OverlayElementBuilder(
        config=config, sticker_dir=str(sticker_dir), rng=rng,
    )
    builder.set_video_info(1920, 1080, 30.0)

    builder.build()
    params = builder.get_applied_params()

    assert params.sticker_files is not None
    assert len(params.sticker_files) >= 1
    assert isinstance(params.sticker_files[0], str)
    assert params.sticker_count is not None
    assert params.sticker_count == len(params.sticker_files)
    assert params.sticker_transparencies is not None
    assert len(params.sticker_transparencies) == params.sticker_count
    assert params.sticker_motion_x_exprs is not None
    assert params.sticker_motion_y_exprs is not None


def test_sticker_empty_dir_does_not_crash(tmp_path):
    """贴纸目录为空时不崩溃，不影响其他效果"""
    empty_sticker_dir = tmp_path / "empty_stickers"
    empty_sticker_dir.mkdir()

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=True,
        danmaku_enabled=False, sticker_enabled=True,
    )
    rng = random.Random(42)
    builder = OverlayElementBuilder(
        config=config, sticker_dir=str(empty_sticker_dir), rng=rng,
    )
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    subtitle = [f for f in filters if "drawtext" in f]
    assert len(subtitle) >= 1

    params = builder.get_applied_params()
    assert params.subtitle_font_size is not None
    assert params.sticker_files is None


def test_sticker_dir_none_does_not_crash(tmp_path):
    """未提供贴纸目录时不崩溃"""
    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    rng = random.Random(42)
    builder = OverlayElementBuilder(config=config, rng=rng)
    builder.set_video_info(1920, 1080, 30.0)

    filters, extra_inputs = builder.build()

    assert filters == []
    assert extra_inputs == []

    params = builder.get_applied_params()
    assert params.sticker_files is None


def test_sticker_logs_applied_params(tmp_path):
    """贴纸叠加完成后记录日志"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "sticker.png").touch()

    logger = MagicMock()
    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    rng = random.Random(42)
    builder = OverlayElementBuilder(
        config=config, sticker_dir=str(sticker_dir),
        rng=rng, logger=logger,
    )
    builder.set_video_info(1920, 1080, 30.0)

    builder.build()

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "贴纸" in call_args or "sticker" in call_args.lower()