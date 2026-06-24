from PySide6.QtCore import QObject, Signal

from video_batch.config_sync import ConfigSync, ConfigSyncError, ServerConfig


class ConfigSyncWorker(QObject):
    """GUI 层配置同步触发器，封装 ConfigSync 的同步操作为 Qt 信号驱动。

    信号:
        config_synced(ServerConfig): 同步成功
        config_version_changed(old_version, new_version): 版本变更
        config_sync_failed(str): 同步失败（含错误信息）
    """

    config_synced = Signal(ServerConfig)
    config_version_changed = Signal(int, int)
    config_sync_failed = Signal(str)

    def __init__(
        self,
        config_sync: ConfigSync,
        parent: QObject | None = None,
    ) -> None:
        super().__init__(parent)
        self._syncer = config_sync

    def sync(self, access_token: str, config_id: str | None = None) -> None:
        try:
            new_config = self._syncer.sync(access_token, config_id)
        except ConfigSyncError as e:
            self.config_sync_failed.emit(str(e))
            return

        cached = self._syncer.get_cached_config()
        if cached is not None and cached.version != new_config.version:
            self.config_version_changed.emit(cached.version, new_config.version)

        self.config_synced.emit(new_config)
