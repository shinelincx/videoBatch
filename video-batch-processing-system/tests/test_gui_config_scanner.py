import json
from unittest.mock import MagicMock, patch

import pytest

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
    ClipDurationConfig,
)
from video_batch.metadata_config import MetadataConfig
from video_batch.material_scanner import MaterialInfo, MaterialScanner, MaterialScanResult, MaterialScanService


def _mock_server_config(**overrides) -> dict:
    data = {
        "version": 5,
        "clip_mode": {"mode": "image-to-video"},
        "video_items": {
            "frame_extraction": True, "cropping": True, "blur": False,
            "shake": True, "watermark": True,
        },
        "text_items": {"subtitles": True, "danmaku": False},
        "affix": {"prepend_enabled": True, "append_enabled": False},
        "audio": {
            "background_music_enabled": True, "speed_adjustment_enabled": False,
            "pitch_enabled": False,
        },
        "repetition": {"loop_count": 3},
    }
    data.update(overrides)
    return data


# ============================================================
# ConfigSyncWorker 测试
# ============================================================

class TestConfigSyncWorker:
    """GUI 层配置同步触发器测试"""

    @pytest.fixture
    def mock_config_sync(self, tmp_path):
        syncer = MagicMock(spec=ConfigSync)
        syncer._cache_path = tmp_path / "server_config.json"
        return syncer

    def test_sync_success_emits_config_synced(self, qapp, mock_config_sync):
        from video_batch.gui.config_sync_worker import ConfigSyncWorker

        config = ServerConfig.from_dict(_mock_server_config())
        mock_config_sync.sync.return_value = config
        mock_config_sync.get_cached_config.return_value = None

        worker = ConfigSyncWorker(mock_config_sync)
        received = []

        worker.config_synced.connect(lambda c: received.append(c))

        worker.sync(access_token="at", config_id="cfg-1")

        mock_config_sync.sync.assert_called_once_with("at", "cfg-1")
        assert len(received) == 1
        assert received[0].version == 5

    def test_sync_version_unchanged(self, qapp, mock_config_sync):
        from video_batch.gui.config_sync_worker import ConfigSyncWorker

        config = ServerConfig.from_dict(_mock_server_config())
        mock_config_sync.sync.return_value = config
        mock_config_sync.get_cached_config.return_value = config

        worker = ConfigSyncWorker(mock_config_sync)
        received = []
        worker.config_version_changed.connect(lambda old, new: received.append((old, new)))
        worker.config_synced.connect(lambda c: None)

        worker.sync(access_token="at", config_id="cfg-1")

        assert len(received) == 0

    def test_sync_version_changed(self, qapp, mock_config_sync):
        from video_batch.gui.config_sync_worker import ConfigSyncWorker

        new_config = ServerConfig.from_dict(_mock_server_config(version=6))
        old_config = ServerConfig.from_dict(_mock_server_config(version=5))
        mock_config_sync.sync.return_value = new_config
        mock_config_sync.get_cached_config.return_value = old_config

        worker = ConfigSyncWorker(mock_config_sync)
        received = []
        worker.config_version_changed.connect(lambda old, new: received.append((old, new)))

        worker.sync(access_token="at", config_id="cfg-1")

        assert len(received) == 1
        assert received[0] == (5, 6)

    def test_sync_failure_emits_signal(self, qapp, mock_config_sync):
        from video_batch.gui.config_sync_worker import ConfigSyncWorker

        mock_config_sync.sync.side_effect = ConfigSyncError("网络异常")

        worker = ConfigSyncWorker(mock_config_sync)
        received = []
        worker.config_sync_failed.connect(lambda msg: received.append(msg))

        worker.sync(access_token="at", config_id="cfg-1")

        assert len(received) == 1
        assert "网络异常" in received[0]

    def test_sync_without_config_id(self, qapp, mock_config_sync):
        from video_batch.gui.config_sync_worker import ConfigSyncWorker

        config = ServerConfig.from_dict(_mock_server_config())
        mock_config_sync.sync.return_value = config
        mock_config_sync.get_cached_config.return_value = None

        worker = ConfigSyncWorker(mock_config_sync)
        worker.sync(access_token="at", config_id=None)

        mock_config_sync.sync.assert_called_once_with("at", None)


# ============================================================
# MaterialScannerV2 测试
# ============================================================

class TestMaterialScannerV2:
    """增强素材扫描器测试 — 集成 metadata + 状态上报"""

    @pytest.fixture
    def mock_status_reporter(self):
        return MagicMock()

    def test_scan_returns_material_index(self, tmp_path, mock_status_reporter):
        from video_batch.material_scanner import MaterialScanService

        assets = tmp_path / "assets"
        (assets / "input" / "task-001" / "img").mkdir(parents=True)
        (assets / "input" / "task-001" / "mv").mkdir(parents=True)
        (assets / "input" / "task-001" / "img" / "a.jpg").write_text("img")

        scanner = MaterialScanService(
            assets_dir=assets,
            metadata=MetadataConfig(),
            status_reporter=mock_status_reporter,
        )
        result = scanner.scan("task-001")

        assert result.task_id == "task-001"
        assert len(result.images) == 1

    def test_scan_reports_missing_task_dir(self, tmp_path, mock_status_reporter):
        from video_batch.material_scanner import MaterialScanService

        assets = tmp_path / "assets"
        scanner = MaterialScanService(
            assets_dir=assets,
            metadata=MetadataConfig(),
            status_reporter=mock_status_reporter,
        )
        result = scanner.scan("nonexistent")

        mock_status_reporter.assert_called_once()
        call_args = mock_status_reporter.call_args
        assert call_args[0][0] == "nonexistent"
        assert call_args[0][1] == "剪辑失败"

    def test_scan_with_metadata_scans_bgm_dir(self, tmp_path, mock_status_reporter):
        from video_batch.material_scanner import MaterialScanService

        assets = tmp_path / "assets"
        bgm_dir = tmp_path / "bgm"
        bgm_dir.mkdir(parents=True)
        (bgm_dir / "song.mp3").write_text("music")
        (assets / "input" / "task-001" / "img").mkdir(parents=True)
        (assets / "input" / "task-001" / "mv").mkdir(parents=True)

        scanner = MaterialScanService(
            assets_dir=assets,
            metadata=MetadataConfig(bgm_dir=str(bgm_dir)),
            status_reporter=mock_status_reporter,
        )
        result = scanner.scan("task-001")

        assert len(result.images) == 0
        assert len(result.videos) == 0
        assert result.bgm_dir == str(bgm_dir)

    def test_scan_with_metadata_scans_prepend_append(self, tmp_path, mock_status_reporter):
        from video_batch.material_scanner import MaterialScanService

        assets = tmp_path / "assets"
        pre = tmp_path / "pre"
        app = tmp_path / "app"
        pre.mkdir(parents=True)
        app.mkdir(parents=True)
        (pre / "intro.mp4").write_text("pre")
        (app / "outro.mp4").write_text("app")
        (assets / "input" / "task-001" / "img").mkdir(parents=True)
        (assets / "input" / "task-001" / "mv").mkdir(parents=True)

        scanner = MaterialScanService(
            assets_dir=assets,
            metadata=MetadataConfig(prepend_dir=str(pre), append_dir=str(app)),
            status_reporter=mock_status_reporter,
        )
        result = scanner.scan("task-001")

        assert result.prepend_dir == str(pre)
        assert result.append_dir == str(app)

    def test_missing_metadata_dirs_do_not_crash(self, tmp_path, mock_status_reporter):
        from video_batch.material_scanner import MaterialScanService

        assets = tmp_path / "assets"
        (assets / "input" / "task-001" / "img").mkdir(parents=True)
        (assets / "input" / "task-001" / "mv").mkdir(parents=True)

        scanner = MaterialScanService(
            assets_dir=assets,
            metadata=MetadataConfig(
                bgm_dir="/nonexistent/bgm",
                prepend_dir="/nonexistent/pre",
            ),
            status_reporter=mock_status_reporter,
        )
        result = scanner.scan("task-001")

        assert result.bgm_dir == "/nonexistent/bgm"

    def test_scan_reports_unsupported_formats(self, tmp_path, mock_status_reporter):
        from video_batch.material_scanner import MaterialScanService

        assets = tmp_path / "assets"
        (assets / "input" / "task-001" / "img").mkdir(parents=True)
        (assets / "input" / "task-001" / "mv").mkdir(parents=True)
        (assets / "input" / "task-001" / "img" / "data.tiff").write_text("tiff")
        logger = MagicMock()

        scanner = MaterialScanService(
            assets_dir=assets,
            metadata=MetadataConfig(),
            status_reporter=mock_status_reporter,
            logger=logger,
        )
        scanner.scan("task-001")

        logger.warning.assert_called()


class TestMaterialScanResult:
    """MaterialScanResult 测试"""

    def test_is_complete_with_images(self):
        result = MaterialScanResult(
            task_id="t1",
            images=[MagicMock()],
            videos=[],
        )
        assert result.has_images() is True
        assert result.has_videos() is False

    def test_is_empty(self):
        result = MaterialScanResult(task_id="t1", images=[], videos=[])
        assert result.has_images() is False
        assert result.has_videos() is False


# ============================================================
# MaterialScanWorker 测试
# ============================================================

class TestMaterialScanWorker:
    """GUI 层素材扫描触发器测试"""

    @pytest.fixture
    def mock_http(self):
        return MagicMock()

    def test_scan_completes_and_emits_signal(self, qapp, tmp_path, mock_http):
        from video_batch.gui.material_scan_worker import MaterialScanWorker

        assets = tmp_path / "assets"
        (assets / "input" / "task-001" / "img").mkdir(parents=True)
        (assets / "input" / "task-001" / "mv").mkdir(parents=True)
        (assets / "input" / "task-001" / "img" / "a.jpg").write_text("img")

        worker = MaterialScanWorker(
            base_url="http://api.example.com",
            http_session=mock_http,
            assets_dir=assets,
        )
        received = []
        worker.scan_completed.connect(lambda r: received.append(r))

        worker.scan(task_id="task-001", metadata=MetadataConfig())

        assert len(received) == 1
        assert received[0].task_id == "task-001"

    def test_scan_missing_task_reports_status(self, qapp, tmp_path, mock_http):
        from video_batch.gui.material_scan_worker import MaterialScanWorker

        assets = tmp_path / "assets"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_http.put.return_value = mock_response

        worker = MaterialScanWorker(
            base_url="http://api.example.com",
            http_session=mock_http,
            assets_dir=assets,
        )

        worker.scan(task_id="nonexistent", metadata=MetadataConfig(),
                     access_token="at")

        assert mock_http.put.called
        call_url = mock_http.put.call_args[0][0]
        assert "nonexistent" in call_url
        assert "status" in call_url
