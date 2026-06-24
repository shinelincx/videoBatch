from video_batch.config_sync import (
    AffixToggleConfig,
    AudioToggleConfig,
    ClipModeConfig,
    ConfigParseError,
    RepetitionConfig,
    ServerConfig,
    TextItemConfig,
    VideoItemConfig,
)


# ============================================================
# 辅助函数
# ============================================================

def _mock_server_api_config(**overrides) -> dict:
    """服务端 /clip_config/config_map 返回的标准开关数据。"""
    data = {
        "version": 5,
        "clip_mode": {"mode": "image-to-video"},
        "video_items": {
            "frame_extraction": True,
            "cropping": True,
            "blur": False,
            "shake": True,
            "watermark": True,
        },
        "text_items": {
            "subtitles": True,
            "subtitles_mode": "images",
            "danmaku": False,
        },
        "affix": {"prepend_enabled": True, "append_enabled": False},
        "audio": {
            "background_music_enabled": True,
            "speed_adjustment_enabled": False,
        },
        "repetition": {"loop_count": 3},
    }
    data.update(overrides)
    return data


# ============================================================
# AudioToggleConfig
# ============================================================

class TestAudioToggleConfig:
    def test_parse_from_dict(self):
        cfg = AudioToggleConfig(
            background_music_enabled=True,
            speed_adjustment_enabled=False,
        )
        assert cfg.background_music_enabled is True
        assert cfg.speed_adjustment_enabled is False

    def test_is_frozen(self):
        import pytest
        cfg = AudioToggleConfig(
            background_music_enabled=True,
            speed_adjustment_enabled=True,
        )
        with pytest.raises(Exception):
            cfg.background_music_enabled = False


# ============================================================
# AffixToggleConfig
# ============================================================

class TestAffixToggleConfig:
    def test_parse_from_dict(self):
        cfg = AffixToggleConfig(prepend_enabled=True, append_enabled=False)
        assert cfg.prepend_enabled is True
        assert cfg.append_enabled is False

    def test_is_frozen(self):
        import pytest
        cfg = AffixToggleConfig(prepend_enabled=True, append_enabled=True)
        with pytest.raises(Exception):
            cfg.prepend_enabled = False


# ============================================================
# ServerConfig
# ============================================================

class TestServerConfigFromDict:
    def test_parses_full_config(self):
        config = ServerConfig.from_dict(_mock_server_api_config())
        assert config.version == 5
        assert config.clip_mode.mode == "image-to-video"
        assert config.video_items.frame_extraction is True
        assert config.video_items.blur is False
        assert config.text_items.subtitles is True
        assert config.text_items.danmaku is False
        assert config.subtitles_mode == "images"
        assert config.affix.prepend_enabled is True
        assert config.affix.append_enabled is False
        assert config.audio.background_music_enabled is True
        assert config.audio.speed_adjustment_enabled is False
        assert config.repetition.loop_count == 3

    def test_raises_on_missing_version(self):
        import pytest
        with pytest.raises(ConfigParseError):
            ServerConfig.from_dict({})

    def test_raises_on_missing_clip_mode(self):
        import pytest
        with pytest.raises(ConfigParseError):
            ServerConfig.from_dict({"version": 1})

    def test_is_frozen(self):
        import pytest
        config = ServerConfig.from_dict(_mock_server_api_config())
        with pytest.raises(Exception):
            config.version = 99

    def test_sub_configs_are_frozen(self):
        import pytest
        config = ServerConfig.from_dict(_mock_server_api_config())
        with pytest.raises(Exception):
            config.clip_mode.mode = "reference-video"

    def test_no_material_paths_field(self):
        """ServerConfig 不应包含 material_paths（已移至 LocalConfig）"""
        config = ServerConfig.from_dict(_mock_server_api_config())
        assert not hasattr(config, "material_paths")

    def test_no_randomization_field(self):
        """ServerConfig 不应包含 randomization（已移至 LocalConfig）"""
        config = ServerConfig.from_dict(_mock_server_api_config())
        assert not hasattr(config, "randomization")

    def test_no_audio_items_param_field(self):
        """ServerConfig 不应包含 audio_items 的参数（voice_type/speech_speed），只用开关"""
        config = ServerConfig.from_dict(_mock_server_api_config())
        assert not hasattr(config, "audio_items")

    def test_subtitles_mode_defaults_to_text(self):
        data = _mock_server_api_config()
        data["text_items"].pop("subtitles_mode")

        config = ServerConfig.from_dict(data)

        assert config.subtitles_mode == "text"

    def test_subtitles_mode_reads_legacy_top_level_value(self):
        data = _mock_server_api_config()
        data["text_items"].pop("subtitles_mode")
        data["subtitles_mode"] = "images"

        config = ServerConfig.from_dict(data)

        assert config.subtitles_mode == "images"

    def test_parses_image_transition_config(self):
        data = _mock_server_api_config(
            transition={
                "enabled": True,
                "duration": 0.7,
                "types": ["fade", "wipeleft"],
            },
        )

        config = ServerConfig.from_dict(data)

        assert config.clip_mode.transition_enabled is True
        assert config.clip_mode.transition_duration == 0.7
        assert config.clip_mode.transition_types == ("fade", "wipeleft")


class TestServerConfigToDict:
    def test_roundtrip(self):
        original = ServerConfig.from_dict(_mock_server_api_config())
        data = original.to_dict()
        restored = ServerConfig.from_dict(data)
        assert original == restored

    def test_to_dict_excludes_material_and_randomization(self):
        """to_dict 不输出 material_paths 和 randomization"""
        config = ServerConfig.from_dict(_mock_server_api_config())
        data = config.to_dict()
        assert "material_paths" not in data
        assert "randomization" not in data
        assert "subtitles_mode" not in data
        assert data["text_items"]["subtitles_mode"] == "images"
        assert "audio" in data
        assert data["audio"] == {
            "background_music_enabled": True,
            "speed_adjustment_enabled": False,
            "pitch_enabled": False,
            "pitch_mode": "",
        }
        assert "affix" in data
        assert data["affix"] == {
            "prepend_enabled": True,
            "append_enabled": False,
        }
