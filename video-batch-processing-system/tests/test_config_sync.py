"""config_sync 测试 — 验证服务端配置（仅开关）的同步、解析、缓存和回滚。"""

import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock

from video_batch.config_sync import (
    AffixToggleConfig,
    AudioToggleConfig,
    ClipModeConfig,
    ConfigParseError,
    ConfigSync,
    ConfigSyncError,
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
        "text_items": {"subtitles": True, "danmaku": False},
        "affix": {"prepend_enabled": True, "append_enabled": False},
        "audio": {
            "background_music_enabled": True,
            "speed_adjustment_enabled": False,
            "pitch_enabled": False,
            "pitch_mode": "",
        },
        "repetition": {"loop_count": 3},
    }
    data.update(overrides)
    return data


# ============================================================
# AC-1: 服务端配置（仅开关）完整解析
# ============================================================

class TestServerConfigParsing:
    def test_parses_all_toggle_fields(self):
        """解析所有开关字段"""
        config = ServerConfig.from_dict(_mock_server_api_config())
        assert config.version == 5
        assert config.clip_mode.mode == "image-to-video"
        assert config.video_items.frame_extraction is True
        assert config.video_items.cropping is True
        assert config.video_items.blur is False
        assert config.video_items.shake is True
        assert config.video_items.watermark is True
        assert config.text_items.subtitles is True
        assert config.text_items.danmaku is False
        assert config.text_items.sticker_enabled is False
        assert config.affix.prepend_enabled is True
        assert config.affix.append_enabled is False
        assert config.audio.background_music_enabled is True
        assert config.audio.speed_adjustment_enabled is False
        assert config.audio.pitch_enabled is False
        assert config.repetition.loop_count == 3

    def test_parses_reference_video_mode(self):
        """解析参考视频模式"""
        config = ServerConfig.from_dict(
            _mock_server_api_config(
                clip_mode={"mode": "reference-video"},
            ),
        )
        assert config.clip_mode.mode == "reference-video"

    def test_defaults_for_missing_affix_and_audio(self):
        """affix 和 audio 缺失时使用默认 false"""
        data = _mock_server_api_config()
        del data["affix"]
        del data["audio"]
        config = ServerConfig.from_dict(data)
        assert config.affix.prepend_enabled is False
        assert config.affix.append_enabled is False
        assert config.audio.background_music_enabled is False
        assert config.audio.speed_adjustment_enabled is False
        assert config.audio.pitch_enabled is False

    def test_raises_on_missing_version(self):
        with pytest.raises(ConfigParseError):
            ServerConfig.from_dict({})

    def test_raises_on_missing_clip_mode(self):
        with pytest.raises(ConfigParseError):
            ServerConfig.from_dict({"version": 1})

    def test_parses_sticker_field(self):
        """text_items 中包含 sticker 字段时正确解析"""
        config = ServerConfig.from_dict(
            _mock_server_api_config(
                text_items={"subtitles": True, "danmaku": False, "sticker": True},
            ),
        )
        assert config.text_items.sticker_enabled is True

    def test_sticker_defaults_to_false(self):
        """sticker 字段缺失时默认为 False（向后兼容）"""
        config = ServerConfig.from_dict(
            _mock_server_api_config(
                text_items={"subtitles": True, "danmaku": False},
            ),
        )
        assert config.text_items.sticker_enabled is False

    def test_parses_pitch_fields(self):
        """audio 中包含 pitch_enabled 时正确解析"""
        config = ServerConfig.from_dict(
            _mock_server_api_config(
                audio={
                    "background_music_enabled": True,
                    "speed_adjustment_enabled": False,
                    "pitch_enabled": True,
                },
            ),
        )
        assert config.audio.pitch_enabled is True

    def test_pitch_fields_default_when_missing(self):
        """pitch_enabled 缺失时使用默认值"""
        config = ServerConfig.from_dict(
            _mock_server_api_config(
                audio={
                    "background_music_enabled": True,
                    "speed_adjustment_enabled": True,
                },
            ),
        )
        assert config.audio.pitch_enabled is False


# ============================================================
# AC-2: 配置序列化
# ============================================================

class TestServerConfigSerialization:
    def test_to_dict_roundtrip(self):
        original = ServerConfig.from_dict(_mock_server_api_config())
        data = original.to_dict()
        restored = ServerConfig.from_dict(data)
        assert original == restored

    def test_to_dict_excludes_material_and_randomization(self):
        """to_dict 不包含 material_paths 和 randomization"""
        config = ServerConfig.from_dict(_mock_server_api_config())
        data = config.to_dict()
        assert "material_paths" not in data
        assert "randomization" not in data


# ============================================================
# AC-3: UserConfig 别名保持向后兼容
# ============================================================

class TestUserConfigAlias:
    def test_userconfig_is_serverconfig(self):
        from video_batch.config_sync import UserConfig
        config = UserConfig.from_dict(_mock_server_api_config())
        assert isinstance(config, ServerConfig)

    def test_accesses_fields_like_old_interface(self):
        from video_batch.config_sync import UserConfig
        config = UserConfig.from_dict(_mock_server_api_config())
        assert config.video_items.frame_extraction is True
        assert config.text_items.subtitles is True
        assert config.repetition.loop_count == 3


# ============================================================
# AC-4: ServerConfig 是不可变的
# ============================================================

class TestServerConfigImmutability:
    def test_server_config_is_frozen(self):
        config = ServerConfig.from_dict(_mock_server_api_config())
        with pytest.raises(Exception):
            config.version = 99

    def test_sub_configs_are_frozen(self):
        config = ServerConfig.from_dict(_mock_server_api_config())
        with pytest.raises(Exception):
            config.clip_mode.mode = "reference-video"


# ============================================================
# AC-5: 配置同步成功流程
# ============================================================

class TestConfigSyncSuccess:
    def test_sync_fetches_and_returns_config(self, tmp_path):
        mock_http = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = _mock_server_api_config()
        mock_http.get.return_value = mock_resp

        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=mock_http,
            config_dir=tmp_path,
        )
        config = syncer.sync("test-token")

        assert config.version == 5
        assert config.clip_mode.mode == "image-to-video"
        mock_http.get.assert_called_once()

    def test_sync_writes_cache_file(self, tmp_path):
        mock_http = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = _mock_server_api_config()
        mock_http.get.return_value = mock_resp

        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=mock_http,
            config_dir=tmp_path,
        )
        syncer.sync("test-token")

        cache_file = tmp_path / "server_config.json"
        assert cache_file.exists()

        raw = json.loads(cache_file.read_text(encoding="utf-8"))
        assert raw["version"] == 5

    def test_get_cached_config_after_sync(self, tmp_path):
        mock_http = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = _mock_server_api_config()
        mock_http.get.return_value = mock_resp

        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=mock_http,
            config_dir=tmp_path,
        )
        syncer.sync("test-token")
        cached = syncer.get_cached_config()
        assert cached is not None
        assert cached.version == 5


# ============================================================
# AC-6: 异常与回滚
# ============================================================

class TestConfigSyncErrors:
    def test_network_error_falls_back_to_cache(self, tmp_path):
        cache_data = _mock_server_api_config(version=3)
        cache_file = tmp_path / "server_config.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(
            json.dumps(cache_data), encoding="utf-8",
        )

        mock_http = MagicMock()
        mock_http.get.side_effect = ConnectionError("网络不可达")

        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=mock_http,
            config_dir=tmp_path,
        )
        config = syncer.sync("test-token")
        assert config.version == 3

    def test_http_error_falls_back_to_cache(self, tmp_path):
        cache_data = _mock_server_api_config(version=4)
        cache_file = tmp_path / "server_config.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(
            json.dumps(cache_data), encoding="utf-8",
        )

        mock_http = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_http.get.return_value = mock_resp

        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=mock_http,
            config_dir=tmp_path,
        )
        config = syncer.sync("test-token")
        assert config.version == 4

    def test_raises_on_network_error_without_cache(self, tmp_path):
        mock_http = MagicMock()
        mock_http.get.side_effect = ConnectionError("网络不可达")

        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=mock_http,
            config_dir=tmp_path,
        )
        with pytest.raises(ConfigSyncError):
            syncer.sync("test-token")

    def test_parse_error_rolls_back_to_cache(self, tmp_path):
        cache_data = _mock_server_api_config(version=2)
        cache_file = tmp_path / "server_config.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(
            json.dumps(cache_data), encoding="utf-8",
        )

        mock_http = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"version": 9}
        mock_http.get.return_value = mock_resp

        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=mock_http,
            config_dir=tmp_path,
        )
        config = syncer.sync("test-token")
        assert config.version == 2

    def test_get_cached_config_returns_none_without_cache(self, tmp_path):
        syncer = ConfigSync(
            base_url="http://api.example.com",
            http_session=MagicMock(),
            config_dir=tmp_path,
        )
        assert syncer.get_cached_config() is None