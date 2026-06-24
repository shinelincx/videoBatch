from video_batch.randomization_config import (
    AudioRandomConfig,
    FrameRandomRangeConfig,
    OverlayRandomConfig,
    MediaFormatsConfig,
    RandomizationConfig,
)


class TestFrameRandomRangeConfig:
    def test_default_values_match_current_hardcoded_constants(self):
        """默认值与当前硬编码范围一致"""
        cfg = FrameRandomRangeConfig()
        assert cfg.drop_frame_min == 5
        assert cfg.drop_frame_max == 20
        assert cfg.crop_pct_min == 1.0
        assert cfg.crop_pct_max == 2.0
        assert cfg.blur_strength_min == 1.0
        assert cfg.blur_strength_max == 3.0
        assert cfg.shake_pct_min == 1.0
        assert cfg.shake_pct_max == 3.0

    def test_from_dict_parses_all_fields(self):
        """从字典解析所有字段"""
        data = {
            "drop_frame_range": [3, 15],
            "crop_pct_range": [0.5, 1.5],
            "blur_strength_range": [0.5, 2.5],
            "shake_pct_range": [0.5, 2.5],
        }
        cfg = FrameRandomRangeConfig.from_dict(data)
        assert cfg.drop_frame_min == 3
        assert cfg.drop_frame_max == 15
        assert cfg.crop_pct_min == 0.5
        assert cfg.crop_pct_max == 1.5
        assert cfg.blur_strength_min == 0.5
        assert cfg.blur_strength_max == 2.5
        assert cfg.shake_pct_min == 0.5
        assert cfg.shake_pct_max == 2.5

    def test_from_dict_partial_fills_defaults(self):
        """部分字段缺失时使用默认值"""
        cfg = FrameRandomRangeConfig.from_dict({"drop_frame_range": [1, 10]})
        assert cfg.drop_frame_min == 1
        assert cfg.drop_frame_max == 10
        assert cfg.crop_pct_min == 1.0

    def test_color_adjustment_defaults(self):
        """色彩调整字段默认值与 PRD 定义一致"""
        cfg = FrameRandomRangeConfig()
        assert cfg.bright_min == -0.2
        assert cfg.bright_max == 0.2
        assert cfg.contrast_min == 0.5
        assert cfg.contrast_max == 1.5
        assert cfg.saturation_min == 0.5
        assert cfg.saturation_max == 1.5

    def test_from_dict_color_fields(self):
        """从字典解析色彩调整字段"""
        data = {
            "brightness_range": [-0.15, 0.15],
            "contrast_range": [0.8, 1.2],
            "saturation_range": [0.7, 1.3],
        }
        cfg = FrameRandomRangeConfig.from_dict(data)
        assert cfg.bright_min == -0.15
        assert cfg.bright_max == 0.15
        assert cfg.contrast_min == 0.8
        assert cfg.contrast_max == 1.2
        assert cfg.saturation_min == 0.7
        assert cfg.saturation_max == 1.3

    def test_from_dict_color_partial_fills_defaults(self):
        """色彩调整字段缺失时使用默认值"""
        cfg = FrameRandomRangeConfig.from_dict({"brightness_range": [-0.1, 0.3]})
        assert cfg.bright_min == -0.1
        assert cfg.bright_max == 0.3
        assert cfg.contrast_min == 0.5
        assert cfg.saturation_min == 0.5

    def test_to_dict_roundtrips(self):
        """to_dict 与 from_dict 往返一致"""
        original = FrameRandomRangeConfig()
        data = original.to_dict()
        restored = FrameRandomRangeConfig.from_dict(data)
        assert original == restored

    def test_to_dict_includes_color_fields(self):
        """to_dict 输出包含色彩调整字段"""
        cfg = FrameRandomRangeConfig(
            bright_min=-0.1, bright_max=0.1,
            contrast_min=0.8, contrast_max=1.2,
            saturation_min=0.7, saturation_max=1.3,
        )
        data = cfg.to_dict()
        assert data["brightness_range"] == [-0.1, 0.1]
        assert data["contrast_range"] == [0.8, 1.2]
        assert data["saturation_range"] == [0.7, 1.3]

    def test_color_effects_defaults(self):
        """色彩效果字段默认值与 PRD 定义一致"""
        cfg = FrameRandomRangeConfig()
        assert cfg.color_balance_min == -0.2
        assert cfg.color_balance_max == 0.2
        assert cfg.gamma_min == 0.5
        assert cfg.gamma_max == 1.5
        assert cfg.vintage_bw_min == 0.5
        assert cfg.vintage_bw_max == 1.5

    def test_from_dict_color_effects_fields(self):
        """从字典解析色彩效果字段"""
        data = {
            "color_balance_range": [-0.15, 0.15],
            "gamma_range": [0.7, 1.3],
            "vintage_bw_range": [0.6, 1.4],
        }
        cfg = FrameRandomRangeConfig.from_dict(data)
        assert cfg.color_balance_min == -0.15
        assert cfg.color_balance_max == 0.15
        assert cfg.gamma_min == 0.7
        assert cfg.gamma_max == 1.3
        assert cfg.vintage_bw_min == 0.6
        assert cfg.vintage_bw_max == 1.4

    def test_from_dict_color_effects_partial_fills_defaults(self):
        """色彩效果字段缺失时使用默认值"""
        cfg = FrameRandomRangeConfig.from_dict({"gamma_range": [0.8, 1.2]})
        assert cfg.gamma_min == 0.8
        assert cfg.gamma_max == 1.2
        assert cfg.color_balance_min == -0.2
        assert cfg.vintage_bw_min == 0.5

    def test_to_dict_includes_color_effects_fields(self):
        """to_dict 输出包含色彩效果字段"""
        cfg = FrameRandomRangeConfig(
            color_balance_min=-0.15, color_balance_max=0.15,
            gamma_min=0.7, gamma_max=1.3,
            vintage_bw_min=0.6, vintage_bw_max=1.4,
        )
        data = cfg.to_dict()
        assert data["color_balance_range"] == [-0.15, 0.15]
        assert data["gamma_range"] == [0.7, 1.3]
        assert data["vintage_bw_range"] == [0.6, 1.4]


class TestOverlayRandomConfig:
    def test_default_values_match_current_hardcoded_constants(self):
        """默认值与当前硬编码范围一致"""
        cfg = OverlayRandomConfig()
        assert cfg.watermark_transparency_min == 0.7
        assert cfg.watermark_transparency_max == 0.9
        assert cfg.subtitle_font_size_min == 20
        assert cfg.subtitle_font_size_max == 40
        assert cfg.subtitle_colors == ["white", "yellow", "green", "cyan"]
        assert cfg.subtitle_x_options == ["(w-text_w)/2", "w*0.2", "w*0.6"]
        assert cfg.subtitle_y_options == ["h*0.9", "h*0.8", "h*0.85"]
        assert cfg.danmaku_texts == ["666", "来了来了", "牛啊", "太强了", "厉害了"]
        assert cfg.danmaku_colors == ["white", "red", "yellow", "orange"]
        assert cfg.danmaku_speed_min == 50
        assert cfg.danmaku_speed_max == 150
        assert cfg.danmaku_density_min == 3
        assert cfg.danmaku_density_max == 8
        assert cfg.danmaku_font_size_min == 20
        assert cfg.danmaku_font_size_max == 36
        assert cfg.danmaku_y_pct_min == 0.05
        assert cfg.danmaku_y_pct_max == 0.9

    def test_from_dict_parses_all_fields(self):
        """从字典解析所有叠加元素随机字段"""
        data = {
            "watermark_transparency_range": [0.5, 0.8],
            "subtitle_font_size_range": [18, 36],
            "subtitle_colors": ["red", "blue"],
            "subtitle_x_options": ["w*0.1"],
            "subtitle_y_options": ["h*0.7"],
            "danmaku_texts": ["你好", "加油"],
            "danmaku_colors": ["pink"],
            "danmaku_speed_range": [30, 100],
            "danmaku_density_range": [2, 5],
            "danmaku_font_size_range": [16, 30],
            "danmaku_y_pct_range": [0.1, 0.8],
        }
        cfg = OverlayRandomConfig.from_dict(data)
        assert cfg.watermark_transparency_min == 0.5
        assert cfg.watermark_transparency_max == 0.8
        assert cfg.subtitle_font_size_min == 18
        assert cfg.subtitle_font_size_max == 36
        assert cfg.subtitle_colors == ["red", "blue"]
        assert cfg.danmaku_texts == ["你好", "加油"]

    def test_from_dict_partial_fills_defaults(self):
        """部分字段缺失时使用默认值"""
        cfg = OverlayRandomConfig.from_dict({"danmaku_texts": ["测试"]})
        assert cfg.danmaku_texts == ["测试"]
        assert cfg.subtitle_colors == ["white", "yellow", "green", "cyan"]

    def test_to_dict_roundtrips(self):
        """to_dict 与 from_dict 往返一致"""
        original = OverlayRandomConfig()
        data = original.to_dict()
        restored = OverlayRandomConfig.from_dict(data)
        assert original == restored


class TestMediaFormatsConfig:
    def test_default_values_match_current_hardcoded_lists(self):
        """默认格式列表与当前硬编码一致"""
        cfg = MediaFormatsConfig()
        assert "mp3" in cfg.audio_formats
        assert "wav" in cfg.audio_formats
        assert "mp4" in cfg.video_formats
        assert "mov" in cfg.video_formats

    def test_from_dict_parses_formats(self):
        """从字典解析格式列表"""
        data = {
            "audio": ["mp3", "ogg"],
            "video": ["mp4", "webm"],
        }
        cfg = MediaFormatsConfig.from_dict(data)
        assert cfg.audio_formats == {"mp3", "ogg"}
        assert cfg.video_formats == {"mp4", "webm"}

    def test_from_dict_partial_fills_defaults(self):
        """部分字段缺失时使用默认值"""
        cfg = MediaFormatsConfig.from_dict({"audio": ["mp3"]})
        assert cfg.audio_formats == {"mp3"}
        assert "mp4" in cfg.video_formats

    def test_to_dict_roundtrips(self):
        """to_dict 与 from_dict 往返一致"""
        original = MediaFormatsConfig()
        data = original.to_dict()
        restored = MediaFormatsConfig.from_dict(data)
        assert original == restored


class TestAudioRandomConfig:
    def test_default_values(self):
        """默认语速范围与当前硬编码一致（0.85 ~ 1.15）"""
        cfg = AudioRandomConfig()
        assert cfg.speed_min == 0.85
        assert cfg.speed_max == 1.15

    def test_from_dict_parses_all_fields(self):
        """从字典解析所有字段"""
        cfg = AudioRandomConfig.from_dict({
            "speed_range": [0.8, 1.2],
        })
        assert cfg.speed_min == 0.8
        assert cfg.speed_max == 1.2

    def test_from_dict_partial_fills_defaults(self):
        """空字典使用默认值"""
        cfg = AudioRandomConfig.from_dict({})
        assert cfg.speed_min == 0.85
        assert cfg.speed_max == 1.15

    def test_to_dict_roundtrips(self):
        """to_dict 与 from_dict 往返一致"""
        original = AudioRandomConfig()
        data = original.to_dict()
        restored = AudioRandomConfig.from_dict(data)
        assert original == restored

    def test_to_dict_output_format(self):
        """to_dict 输出正确的 [min, max] 格式"""
        cfg = AudioRandomConfig(speed_min=0.7, speed_max=1.3)
        data = cfg.to_dict()
        assert data["speed_range"] == [0.7, 1.3]

    def test_pitch_semitones_defaults(self):
        """默认变调半音数范围为 [-5, 5]"""
        cfg = AudioRandomConfig()
        assert cfg.pitch_semitones_min == -5.0
        assert cfg.pitch_semitones_max == 5.0

    def test_pitch_semitones_from_dict(self):
        """从字典解析变调半音数范围"""
        cfg = AudioRandomConfig.from_dict({
            "speed_range": [0.85, 1.15],
            "pitch_semitones_range": [-4.0, 4.0],
        })
        assert cfg.pitch_semitones_min == -4.0
        assert cfg.pitch_semitones_max == 4.0

    def test_pitch_semitones_defaults_when_missing(self):
        """pitch_semitones_range 缺失时使用默认值 [-5, 5]"""
        cfg = AudioRandomConfig.from_dict({"speed_range": [0.8, 1.2]})
        assert cfg.pitch_semitones_min == -5.0
        assert cfg.pitch_semitones_max == 5.0

    def test_pitch_semitones_to_dict(self):
        """to_dict 输出包含 pitch_semitones_range"""
        cfg = AudioRandomConfig(
            pitch_semitones_min=-4.0, pitch_semitones_max=4.0,
        )
        data = cfg.to_dict()
        assert data["pitch_semitones_range"] == [-4.0, 4.0]


class TestRandomizationConfig:
    def test_default_config_has_all_sections(self):
        """默认配置包含所有子配置节"""
        cfg = RandomizationConfig()
        assert isinstance(cfg.frame, FrameRandomRangeConfig)
        assert isinstance(cfg.overlay, OverlayRandomConfig)
        assert isinstance(cfg.media_formats, MediaFormatsConfig)
        assert isinstance(cfg.audio, AudioRandomConfig)
        assert isinstance(cfg.copywriting_styles, list)

    def test_default_copywriting_styles_match_current(self):
        """默认文案风格与当前硬编码一致"""
        cfg = RandomizationConfig()
        assert set(cfg.copywriting_styles) == {"幽默", "正式", "亲切", "悬疑"}

    def test_from_dict_parses_all_sections(self):
        """从完整字典解析所有节"""
        data = {
            "frame": {
                "drop_frame_range": [3, 15],
                "crop_pct_range": [0.5, 1.5],
                "blur_strength_range": [0.5, 2.5],
                "shake_pct_range": [0.5, 2.5],
            },
            "overlay": {
                "watermark_transparency_range": [0.5, 0.8],
                "subtitle_font_size_range": [18, 36],
                "subtitle_colors": ["red", "blue"],
                "subtitle_x_options": ["w*0.1"],
                "subtitle_y_options": ["h*0.7"],
                "danmaku_texts": ["测试"],
                "danmaku_colors": ["pink"],
                "danmaku_speed_range": [30, 100],
                "danmaku_density_range": [2, 5],
                "danmaku_font_size_range": [16, 30],
                "danmaku_y_pct_range": [0.1, 0.8],
            },
            "audio": {
                "speed_range": [0.8, 1.2],
            },
            "media_formats": {
                "audio": ["mp3", "ogg"],
                "video": ["mp4", "webm"],
            },
            "copywriting_styles": ["幽默", "亲切"],
        }
        cfg = RandomizationConfig.from_dict(data)
        assert cfg.frame.drop_frame_min == 3
        assert cfg.overlay.watermark_transparency_min == 0.5
        assert cfg.audio.speed_min == 0.8
        assert cfg.audio.speed_max == 1.2
        assert cfg.media_formats.audio_formats == {"mp3", "ogg"}
        assert cfg.copywriting_styles == ["幽默", "亲切"]

    def test_from_dict_empty_uses_all_defaults(self):
        """空字典使用全部默认值"""
        cfg = RandomizationConfig.from_dict({})
        assert cfg.frame.drop_frame_min == 5
        assert cfg.overlay.danmaku_speed_min == 50
        assert "mp4" in cfg.media_formats.video_formats
        assert "正式" in cfg.copywriting_styles

    def test_to_dict_roundtrips(self):
        """to_dict 与 from_dict 往返一致"""
        original = RandomizationConfig()
        data = original.to_dict()
        restored = RandomizationConfig.from_dict(data)
        assert original == restored