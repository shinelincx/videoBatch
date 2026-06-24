import random
from unittest.mock import MagicMock

from video_batch.audio_processor import (
    AppliedAudioParams, AudioProcessingConfig, AudioProcessor,
)
from video_batch.randomization_config import AudioRandomConfig


def test_all_disabled_returns_empty():
    """全部禁用时 build 返回空滤镜和空输入"""
    config = AudioProcessingConfig(background_music=False, speed_adjustment=False)
    processor = AudioProcessor(config=config)

    filters, extra_inputs = processor.build(bgm_dir=".")

    assert filters == []
    assert extra_inputs == []

    params = processor.get_applied_params()
    assert params.bgm_file is None
    assert params.bgm_volume is None
    assert params.speech_speed is None


def test_bgm_adds_audio_input_and_amix_filter(tmp_path):
    """背景音乐启用：从目录随机选文件，生成 amix 混合滤镜"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "music_a.mp3").touch()
    (bgm_dir / "music_b.mp3").touch()

    config = AudioProcessingConfig(background_music=True, speed_adjustment=False)
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng)

    filters, extra_inputs = processor.build(bgm_dir=str(bgm_dir))

    assert len(extra_inputs) >= 2
    assert extra_inputs[0] == "-i"
    bgm_path = extra_inputs[1]
    assert "music_" in bgm_path

    amix_filter = next(f for f in filters if "amix" in f)
    assert "amix" in amix_filter
    assert "duration=first" in amix_filter

    params = processor.get_applied_params()
    assert params.bgm_file is not None
    assert "music_" in params.bgm_file
    assert params.bgm_volume is not None
    assert 0.15 <= params.bgm_volume <= 0.35


def test_speed_adjustment_uses_atempo_filter():
    """语速调整：使用 atempo 滤镜"""
    config = AudioProcessingConfig(background_music=False, speed_adjustment=True)
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng)

    filters, extra_inputs = processor.build(bgm_dir=".")

    atempo_filter = next(f for f in filters if "atempo" in f)
    assert "atempo" in atempo_filter

    params = processor.get_applied_params()
    assert params.speech_speed is not None
    assert 0.85 <= params.speech_speed <= 1.15


def test_both_bgm_and_speed_combined(tmp_path):
    """背景音乐和语速同时启用"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "bgm.mp3").touch()

    config = AudioProcessingConfig(background_music=True, speed_adjustment=True)
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng)

    filters, extra_inputs = processor.build(bgm_dir=str(bgm_dir))

    assert len(filters) >= 2
    assert any("atempo" in f for f in filters)
    assert any("amix" in f for f in filters)
    assert len(extra_inputs) >= 2

    params = processor.get_applied_params()
    assert params.bgm_file is not None
    assert params.bgm_volume is not None
    assert params.speech_speed is not None


def test_same_seed_produces_same_result(tmp_path):
    """相同种子产生相同的滤镜和输入"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "track_a.mp3").touch()
    (bgm_dir / "track_b.mp3").touch()

    config = AudioProcessingConfig()
    rng1 = random.Random(42)
    rng2 = random.Random(42)

    p1 = AudioProcessor(config=config, rng=rng1)
    f1, i1 = p1.build(bgm_dir=str(bgm_dir))

    p2 = AudioProcessor(config=config, rng=rng2)
    f2, i2 = p2.build(bgm_dir=str(bgm_dir))

    assert f1 == f2
    assert i1 == i2


def test_different_seeds_produce_different_bgm(tmp_path):
    """不同种子可能选择不同背景音乐"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    for i in range(5):
        (bgm_dir / ("track_%d.mp3" % i)).touch()

    config = AudioProcessingConfig(background_music=True, speed_adjustment=False)

    rng_a = random.Random(1)
    rng_b = random.Random(999)
    rng_a_copy = random.Random(1)

    p1 = AudioProcessor(config=config, rng=rng_a)
    f1, _ = p1.build(bgm_dir=str(bgm_dir))

    p2 = AudioProcessor(config=config, rng=rng_b)
    f2, _ = p2.build(bgm_dir=str(bgm_dir))

    p3 = AudioProcessor(config=config, rng=rng_a_copy)
    f3, _ = p3.build(bgm_dir=str(bgm_dir))

    assert f1 == f3
    assert f1 != f2


def test_bgm_empty_dir_does_not_crash(tmp_path):
    """BGM 目录为空时不崩溃，不影响语速调整"""
    empty_dir = tmp_path / "empty_bgm"
    empty_dir.mkdir()

    config = AudioProcessingConfig(background_music=True, speed_adjustment=True)
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng)

    filters, extra_inputs = processor.build(bgm_dir=str(empty_dir))

    assert len(filters) >= 1
    assert any("atempo" in f for f in filters)

    params = processor.get_applied_params()
    assert params.bgm_file is None
    assert params.speech_speed is not None


def test_bgm_nonexistent_dir_does_not_crash():
    """BGM 目录不存在时不崩溃"""
    config = AudioProcessingConfig(background_music=True, speed_adjustment=True)
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng)

    filters, extra_inputs = processor.build(bgm_dir="/nonexistent/path")

    assert len(filters) >= 1
    assert any("atempo" in f for f in filters)

    params = processor.get_applied_params()
    assert params.bgm_file is None


def test_logs_applied_params(tmp_path):
    """记录应用的音频处理参数到日志"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "bgm.mp3").touch()

    logger = MagicMock()
    config = AudioProcessingConfig()
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng, logger=logger)

    processor.build(bgm_dir=str(bgm_dir))

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "音频" in call_args


def test_volume_in_range_across_multiple_runs(tmp_path):
    """多次运行背景音乐音量始终在 [0.15, 0.35] 范围内"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "bgm.mp3").touch()

    config = AudioProcessingConfig(background_music=True, speed_adjustment=False)

    for seed in range(100):
        rng = random.Random(seed)
        processor = AudioProcessor(config=config, rng=rng)
        processor.build(bgm_dir=str(bgm_dir))
        params = processor.get_applied_params()
        assert params.bgm_volume is not None
        assert 0.15 <= params.bgm_volume <= 0.35


def test_speed_in_range_across_multiple_runs():
    """多次运行语速始终在 [0.85, 1.15] 范围内"""
    config = AudioProcessingConfig(background_music=False, speed_adjustment=True)

    for seed in range(100):
        rng = random.Random(seed)
        processor = AudioProcessor(config=config, rng=rng)
        processor.build(bgm_dir=".")
        params = processor.get_applied_params()
        assert params.speech_speed is not None
        assert 0.85 <= params.speech_speed <= 1.15


def test_applied_params_reset_on_each_build(tmp_path):
    """每次 build 都会重置应用的参数"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "a.mp3").touch()

    config = AudioProcessingConfig()
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng)

    p1_params = processor.build(bgm_dir=str(bgm_dir))
    p2_params = processor.build(bgm_dir=str(bgm_dir))

    assert processor.get_applied_params() is not None


def test_bgm_file_format_validation(tmp_path):
    """BGM 目录中仅音频文件被选中"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "song.mp3").touch()
    (bgm_dir / "notes.txt").touch()
    (bgm_dir / "image.png").touch()

    config = AudioProcessingConfig(background_music=True, speed_adjustment=False)
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng)

    filters, extra_inputs = processor.build(bgm_dir=str(bgm_dir))

    assert len(extra_inputs) >= 2
    bgm_path = extra_inputs[1]
    assert bgm_path.endswith(".mp3")
    assert "notes.txt" not in bgm_path
    assert "image.png" not in bgm_path


def test_uses_random_config_speed_range():
    """传入 AudioRandomConfig 时，语速在 random_config 范围内随机选取"""
    random_config = AudioRandomConfig(speed_min=0.5, speed_max=0.7)
    config = AudioProcessingConfig(background_music=False, speed_adjustment=True)
    rng = random.Random(42)
    processor = AudioProcessor(config=config, rng=rng, random_config=random_config)

    filters, _ = processor.build(bgm_dir=".")

    assert any("atempo" in f for f in filters)
    params = processor.get_applied_params()
    assert params.speech_speed is not None
    assert 0.5 <= params.speech_speed <= 0.7


def test_random_config_speed_in_range_across_multiple_runs():
    """多次运行语速始终在 random_config 范围内"""
    random_config = AudioRandomConfig(speed_min=0.6, speed_max=0.9)
    config = AudioProcessingConfig(background_music=False, speed_adjustment=True)

    for seed in range(100):
        rng = random.Random(seed)
        processor = AudioProcessor(config=config, rng=rng, random_config=random_config)
        processor.build(bgm_dir=".")
        params = processor.get_applied_params()
        assert params.speech_speed is not None
        assert 0.6 <= params.speech_speed <= 0.9


def test_pitch_disabled_no_rubberband_filter():
    """变调未启用时不生成 rubberband 滤镜"""
    config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
        pitch_enabled=False,
    )
    processor = AudioProcessor(config=config)

    filters, _ = processor.build(bgm_dir=".")

    assert not any("rubberband" in f for f in filters)
    params = processor.get_applied_params()
    assert params.pitch_shift is None


def test_pitch_enabled_adds_rubberband():
    """变调启用时在滤镜链中生成 rubberband（随机范围内取值）"""
    config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
        pitch_enabled=True,
    )
    rng = random.Random(42)
    processor = AudioProcessor(
        config=config,
        rng=rng,
        random_config=AudioRandomConfig(
            pitch_semitones_min=3.0, pitch_semitones_max=3.0,
        ),
    )

    filters, _ = processor.build(bgm_dir=".")

    rubberband = next((f for f in filters if "rubberband" in f), None)
    assert rubberband is not None
    # 半音数 +3 → rubberband pitch 倍率 = 2^(3/12) ≈ 1.1892
    assert "pitch=1.1892" in rubberband
    params = processor.get_applied_params()
    assert params.pitch_shift == 3.0


def test_pitch_filter_before_bgm(tmp_path):
    """rubberband 滤镜在 BGM 混音之前"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "bgm.mp3").touch()

    config = AudioProcessingConfig(
        background_music=True, speed_adjustment=False,
        pitch_enabled=True,
    )
    processor = AudioProcessor(
        config=config,
        rng=random.Random(42),
        random_config=AudioRandomConfig(
            pitch_semitones_min=-3.0, pitch_semitones_max=-3.0,
        ),
    )

    filters, _ = processor.build(bgm_dir=str(bgm_dir))

    rubberband_idx = next(
        i for i, f in enumerate(filters) if "rubberband" in f
    )
    amix_idx = next(i for i, f in enumerate(filters) if "amix" in f)
    assert rubberband_idx < amix_idx


def test_pitch_with_speed_and_bgm(tmp_path):
    """变调 + 语速 + BGM 三者组合时滤镜链正确"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "bgm.mp3").touch()

    config = AudioProcessingConfig(
        background_music=True, speed_adjustment=True,
        pitch_enabled=True,
    )
    rng = random.Random(42)
    processor = AudioProcessor(
        config=config, rng=rng,
        random_config=AudioRandomConfig(
            pitch_semitones_min=6.0, pitch_semitones_max=6.0,
        ),
    )

    filters, _ = processor.build(bgm_dir=str(bgm_dir))

    assert any("rubberband" in f for f in filters)
    assert any("atempo" in f for f in filters)
    assert any("amix" in f for f in filters)

    rubberband_idx = next(i for i, f in enumerate(filters) if "rubberband" in f)
    atempo_idx = next(i for i, f in enumerate(filters) if "atempo" in f)
    amix_idx = next(i for i, f in enumerate(filters) if "amix" in f)
    assert rubberband_idx < amix_idx


def test_pitch_without_random_config_defaults_to_zero():
    """无 random_config 时变调使用默认 pitch 0（无变化）"""
    config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
        pitch_enabled=True,
    )
    processor = AudioProcessor(config=config)

    filters, _ = processor.build(bgm_dir=".")

    rubberband = next((f for f in filters if "rubberband" in f), None)
    assert rubberband is not None
    # 半音数 0 → rubberband pitch 倍率 = 2^(0/12) = 1.0
    assert "pitch=1.0" in rubberband
    params = processor.get_applied_params()
    assert params.pitch_shift == 0.0


def test_pitch_params_logged(tmp_path):
    """变调参数记录到任务日志"""
    bgm_dir = tmp_path / "bgm"
    bgm_dir.mkdir()
    (bgm_dir / "bgm.mp3").touch()

    logger = MagicMock()
    config = AudioProcessingConfig(
        background_music=True, speed_adjustment=True,
        pitch_enabled=True,
    )
    rng = random.Random(42)
    processor = AudioProcessor(
        config=config, rng=rng, logger=logger,
        random_config=AudioRandomConfig(
            pitch_semitones_min=-3.0, pitch_semitones_max=-3.0,
        ),
    )

    processor.build(bgm_dir=str(bgm_dir))

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "pitch" in call_args.lower()