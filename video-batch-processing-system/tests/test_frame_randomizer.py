import random
from unittest.mock import MagicMock

from video_batch.frame_randomizer import (
    AppliedRandomization, FrameRandomizationConfig, FrameRandomizer,
)


def test_drop_frame_with_fixed_seed_produces_deterministic_index():
    """固定种子时抽帧位置可预测"""
    config = FrameRandomizationConfig(drop_frame=True, crop=False, blur=False, shake=False)
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    drop_filter = next(f for f in filters if "select='not(eq(n\\," in f)
    assert "select='not(eq(n\\," in drop_filter
    assert any("setpts=" in f for f in filters)

    params = randomizer.get_applied_params()
    assert params.drop_frame_index is not None
    assert 5 <= params.drop_frame_index <= 20


def test_crop_with_fixed_seed_produces_valid_range():
    """裁剪比例在 [1%, 2%] 范围内"""
    config = FrameRandomizationConfig(drop_frame=False, crop=True, blur=False, shake=False)
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    crop_filter = next(f for f in filters if "crop=" in f)
    assert "crop=" in crop_filter

    params = randomizer.get_applied_params()
    assert params.crop_pct is not None
    assert 1.0 <= params.crop_pct <= 2.0


def test_blur_with_fixed_seed_produces_valid_range():
    """模糊强度在 [1%, 3%] 范围内"""
    config = FrameRandomizationConfig(drop_frame=False, crop=False, blur=True, shake=False)
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    blur_filter = next(f for f in filters if "boxblur" in f)
    assert "boxblur" in blur_filter

    params = randomizer.get_applied_params()
    assert params.blur_strength is not None
    assert 1.0 <= params.blur_strength <= 3.0


def test_shake_with_fixed_seed_produces_valid_range():
    """抖动位移在 [1%, 3%] 范围内"""
    config = FrameRandomizationConfig(drop_frame=False, crop=False, blur=False, shake=True)
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    assert any("crop=" in f for f in filters)

    params = randomizer.get_applied_params()
    assert params.shake_pct is not None
    assert 1.0 <= params.shake_pct <= 3.0


def test_all_disabled_returns_empty_filters():
    """全部禁用时 build_filters 返回空列表"""
    config = FrameRandomizationConfig(False, False, False, False, False, False, False, False, False, False)
    randomizer = FrameRandomizer(config=config)
    filters = randomizer.build_filters()
    assert filters == []

    params = randomizer.get_applied_params()
    assert params.drop_frame_index is None
    assert params.crop_pct is None
    assert params.blur_strength is None
    assert params.shake_pct is None


def test_same_seed_produces_same_filters():
    """相同种子产生相同滤镜"""
    config = FrameRandomizationConfig()

    rng1 = random.Random(42)
    rng2 = random.Random(42)

    f1 = FrameRandomizer(config=config, rng=rng1).build_filters()
    f2 = FrameRandomizer(config=config, rng=rng2).build_filters()

    assert f1 == f2


def test_different_seeds_produce_different_filters():
    """不同种子产生不同的滤镜"""
    config = FrameRandomizationConfig(drop_frame=True, crop=True, blur=False, shake=False)

    rng_a = random.Random(1)
    rng_b = random.Random(999)
    rng_a_copy = random.Random(1)

    f1 = FrameRandomizer(config=config, rng=rng_a).build_filters()
    f2 = FrameRandomizer(config=config, rng=rng_b).build_filters()
    f3 = FrameRandomizer(config=config, rng=rng_a_copy).build_filters()

    assert f1 != f2
    assert f1 == f3


def test_all_effects_produce_non_empty_filters():
    """所有效果启用时滤镜非空"""
    config = FrameRandomizationConfig()
    randomizer = FrameRandomizer(config=config)
    filters = randomizer.build_filters()
    assert len(filters) >= 4


def test_logs_applied_params(tmp_path):
    """记录应用的随机参数"""
    logger = MagicMock()
    config = FrameRandomizationConfig()
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng, logger=logger)
    randomizer.build_filters()

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "随机参数" in call_args or "随机化" in call_args


def test_brightness_with_fixed_seed_produces_valid_range():
    """亮度在 [-0.2, 0.2] 范围内，生成 eq 滤镜"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=False, saturation=False,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    eq_filter = next(f for f in filters if "eq=" in f)
    assert "brightness=" in eq_filter

    params = randomizer.get_applied_params()
    assert params.brightness is not None
    assert -0.2 <= params.brightness <= 0.2


def test_contrast_with_fixed_seed_produces_valid_range():
    """对比度在 [0.5, 1.5] 范围内，生成 eq 滤镜"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=True, saturation=False,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    eq_filter = next(f for f in filters if "eq=" in f)
    assert "contrast=" in eq_filter

    params = randomizer.get_applied_params()
    assert params.contrast is not None
    assert 0.5 <= params.contrast <= 1.5


def test_saturation_with_fixed_seed_produces_valid_range():
    """饱和度在 [0.5, 1.5] 范围内，生成 eq 滤镜"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=True,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    eq_filter = next(f for f in filters if "eq=" in f)
    assert "saturation=" in eq_filter

    params = randomizer.get_applied_params()
    assert params.saturation is not None
    assert 0.5 <= params.saturation <= 1.5


def test_all_color_adjustments_combined_single_eq_filter():
    """三项色彩调整合并为一次 eq 滤镜调用"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=True, saturation=True,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    eq_filters = [f for f in filters if "eq=" in f]
    assert len(eq_filters) == 1, "三项应为单个 eq 滤镜"
    eq_filter = eq_filters[0]
    assert "brightness=" in eq_filter
    assert "contrast=" in eq_filter
    assert "saturation=" in eq_filter

    params = randomizer.get_applied_params()
    assert params.brightness is not None
    assert params.contrast is not None
    assert params.saturation is not None


def test_color_adjustments_disabled_returns_no_eq_filter():
    """色彩调整全部禁用时不产生 eq 滤镜"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=False, gamma=False, vintage_bw=False,
    )
    randomizer = FrameRandomizer(config=config)
    filters = randomizer.build_filters()

    eq_filters = [f for f in filters if "eq=" in f]
    assert len(eq_filters) == 0

    params = randomizer.get_applied_params()
    assert params.brightness is None
    assert params.contrast is None
    assert params.saturation is None


def test_color_adjustment_seed_reproducibility():
    """相同种子产生相同的色彩调整参数"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=True, saturation=True,
    )

    rng1 = random.Random(42)
    rng2 = random.Random(42)

    f1 = FrameRandomizer(config=config, rng=rng1).build_filters()
    f2 = FrameRandomizer(config=config, rng=rng2).build_filters()

    assert f1 == f2


def test_color_adjustment_different_seeds_different_values():
    """不同种子产生不同的色彩调整参数"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=False, saturation=False,
    )

    rng_a = random.Random(1)
    rng_b = random.Random(999)

    ra = FrameRandomizer(config=config, rng=rng_a)
    rb = FrameRandomizer(config=config, rng=rng_b)
    ra.build_filters()
    rb.build_filters()

    assert ra.get_applied_params().brightness != rb.get_applied_params().brightness


def test_color_balance_generates_colorbalance_filter():
    """色彩平衡启用时生成 colorbalance 滤镜，R/G/B 独立随机"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=True, gamma=False, vintage_bw=False,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    cb_filter = next(f for f in filters if "colorbalance=" in f)
    assert "rs=" in cb_filter
    assert "gs=" in cb_filter
    assert "bs=" in cb_filter

    params = randomizer.get_applied_params()
    assert params.color_balance_r is not None
    assert params.color_balance_g is not None
    assert params.color_balance_b is not None
    assert -0.2 <= params.color_balance_r <= 0.2
    assert -0.2 <= params.color_balance_g <= 0.2
    assert -0.2 <= params.color_balance_b <= 0.2
    assert params.color_balance_r != params.color_balance_g, "RGB 通道应独立随机"


def test_gamma_added_to_eq_filter():
    """伽马值合并到已有 eq 滤镜中"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=False, saturation=False,
        color_balance=False, gamma=True, vintage_bw=False,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    eq_filter = next(f for f in filters if f.startswith("eq="))
    assert "brightness=" in eq_filter
    assert "gamma=" in eq_filter

    params = randomizer.get_applied_params()
    assert params.gamma is not None
    assert 0.5 <= params.gamma <= 1.5


def test_gamma_alone_generates_eq_filter():
    """仅伽马值启用时仍生成单个 eq 滤镜"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=False, gamma=True, vintage_bw=False,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    eq_filters = [f for f in filters if f.startswith("eq=")]
    assert len(eq_filters) == 1
    assert "gamma=" in eq_filters[0]
    assert "brightness=" not in eq_filters[0]


def test_vintage_bw_generates_hue_and_curves():
    """复古黑白启用时生成 hue=s=0 和 curves 两个滤镜"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=False, gamma=False, vintage_bw=True,
    )
    rng = random.Random(42)

    randomizer = FrameRandomizer(config=config, rng=rng)
    filters = randomizer.build_filters()

    hue_filter = next(f for f in filters if "hue=s=0" in f)
    curves_filter = next(f for f in filters if "curves=all=" in f)
    assert hue_filter != curves_filter, "hue 和 curves 应为独立滤镜"

    params = randomizer.get_applied_params()
    assert params.vintage_bw is not None
    assert 0.5 <= params.vintage_bw <= 1.0


def test_all_color_effects_disabled_no_filters():
    """色彩效果全部禁用时无对应滤镜"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=False, gamma=False, vintage_bw=False,
    )
    randomizer = FrameRandomizer(config=config)
    filters = randomizer.build_filters()

    assert not any("colorbalance" in f for f in filters)
    assert not any(f.startswith("eq=") for f in filters)
    assert not any("hue=s=0" in f for f in filters)

    params = randomizer.get_applied_params()
    assert params.color_balance_r is None
    assert params.gamma is None
    assert params.vintage_bw is None


def test_all_color_effects_seed_reproducibility():
    """相同种子产生相同的色彩效果参数"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=True, saturation=True,
        color_balance=True, gamma=True, vintage_bw=True,
    )

    rng1 = random.Random(42)
    rng2 = random.Random(42)

    f1 = FrameRandomizer(config=config, rng=rng1).build_filters()
    f2 = FrameRandomizer(config=config, rng=rng2).build_filters()

    assert f1 == f2


def test_all_color_effects_different_seeds_different_values():
    """不同种子产生不同的色彩效果参数"""
    config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=True, gamma=True, vintage_bw=True,
    )

    rng_a = random.Random(1)
    rng_b = random.Random(999)

    ra = FrameRandomizer(config=config, rng=rng_a)
    rb = FrameRandomizer(config=config, rng=rng_b)
    ra.build_filters()
    rb.build_filters()

    pa = ra.get_applied_params()
    pb = rb.get_applied_params()
    assert pa.color_balance_r != pb.color_balance_r
    assert pa.gamma != pb.gamma
    assert pa.vintage_bw != pb.vintage_bw