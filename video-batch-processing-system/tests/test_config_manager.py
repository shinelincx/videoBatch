from unittest.mock import MagicMock

from video_batch.config_manager import ConfigManager
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


# ============================================================
# 辅助函数
# ============================================================

def _build_server_config(version: int = 5, mode: str = "image-to-video") -> ServerConfig:
    return ServerConfig(
        version=version,
        clip_mode=ClipModeConfig(mode=mode),
        video_items=VideoItemConfig(
            frame_extraction=True,
            cropping=True,
            blur=False,
            shake=True,
            watermark=True,
        ),
        text_items=TextItemConfig(subtitles=True, danmaku=False),
        affix=AffixToggleConfig(prepend_enabled=True, append_enabled=False),
        audio=AudioToggleConfig(
            background_music_enabled=True,
            speed_adjustment_enabled=False,
        ),
        repetition=RepetitionConfig(loop_count=3),
        clip_duration=ClipDurationConfig(default_duration_per_image=3.5),
    )


# ============================================================
# AC-1: 配置同步与版本对比
# ============================================================

class TestConfigManagerSync:
    def test_sync_returns_cached_when_version_unchanged(self, tmp_path):
        """版本未变更时返回缓存配置"""
        syncer = MagicMock()
        syncer.sync.return_value = _build_server_config(version=5)
        syncer.get_cached_config.return_value = _build_server_config(version=5)

        logger = MagicMock()
        mgr = ConfigManager(syncer=syncer, config_dir=tmp_path, logger=logger)
        result = mgr.sync("token")

        assert result is syncer.get_cached_config.return_value

    def test_sync_updates_when_version_changes(self, tmp_path):
        """版本变更时返回新配置"""
        syncer = MagicMock()
        syncer.sync.return_value = _build_server_config(version=6)
        syncer.get_cached_config.return_value = _build_server_config(version=5)

        logger = MagicMock()
        mgr = ConfigManager(syncer=syncer, config_dir=tmp_path, logger=logger)
        result = mgr.sync("token")

        assert result.version == 6

    def test_sync_without_cache_stores_directly(self, tmp_path):
        """首次同步：无缓存，直接返回新配置"""
        syncer = MagicMock()
        syncer.sync.return_value = _build_server_config(version=10)
        syncer.get_cached_config.return_value = None

        logger = MagicMock()
        mgr = ConfigManager(syncer=syncer, config_dir=tmp_path, logger=logger)
        result = mgr.sync("token")

        assert result.version == 10


# ============================================================
# AC-2: 本地配置加载与保存
# ============================================================

class TestLocalConfigManagement:
    def test_load_local_config_returns_default_when_no_file(self, tmp_path):
        syncer = MagicMock()
        logger = MagicMock()
        mgr = ConfigManager(syncer=syncer, config_dir=tmp_path, logger=logger)

        local = mgr.load_local_config()
        assert local.material_paths.base_dir == "assets"
        assert local.audio_params.voice_type == "female"

    def test_save_and_load_local_config_roundtrips(self, tmp_path):
        syncer = MagicMock()
        logger = MagicMock()
        mgr = ConfigManager(syncer=syncer, config_dir=tmp_path, logger=logger)

        from video_batch.local_config import LocalConfig
        original = LocalConfig()
        mgr.save_local_config(original)

        loaded = mgr.load_local_config()
        assert original == loaded

    def test_local_config_not_overwritten_by_server_version_change(self, tmp_path):
        """版本变更时 LocalConfig 不受影响"""
        syncer = MagicMock()
        logger = MagicMock()
        mgr = ConfigManager(syncer=syncer, config_dir=tmp_path, logger=logger)

        # 先保存自定义本地配置
        from video_batch.local_config import LocalConfig, MaterialPathsConfig
        custom = LocalConfig(
            material_paths=MaterialPathsConfig(base_dir="/custom/path"),
        )
        mgr.save_local_config(custom)

        # 版本变更，同步新 ServerConfig
        syncer.sync.return_value = _build_server_config(version=8)
        syncer.get_cached_config.return_value = _build_server_config(version=5)
        mgr.sync("token")

        # LocalConfig 应保持不变
        local = mgr.load_local_config()
        assert local.material_paths.base_dir == "/custom/path"