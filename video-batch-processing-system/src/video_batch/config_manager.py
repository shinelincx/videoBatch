"""配置管理器 - 处理配置同步、本地配置加载、版本缓存逻辑。

ConfigManager 类协调配置同步流程：
  - 从服务端获取最新服务端配置（仅开关）
  - 加载客户端本地配置（素材路径、随机化范围、音频参数）
  - 对比本地缓存版本，避免不必要的更新
  - 版本变更时仅覆盖服务端配置，保留本地配置
  - 记录配置变更日志

依赖关系：
  - ConfigSync: 执行实际的配置获取和缓存操作
  - LocalConfig: 客户端本地配置
  - Logger: 记录配置变更事件
"""
from pathlib import Path
from typing import TYPE_CHECKING

from video_batch.config_sync import ConfigSync, ServerConfig
from video_batch.local_config import LocalConfig

if TYPE_CHECKING:
    from video_batch.logger import Logger


class ConfigManager:
    """配置管理器，负责配置同步策略、本地配置加载和版本对比。

    核心变化（v2）：服务端仅下发开关，客户端参数由 LocalConfig 独立管理。
      - ServerConfig: 服务端 /clip_config/config_map 返回的开关配置
      - LocalConfig:  客户端本地的 local_config.json 配置
      - 版本变更时仅覆盖 ServerConfig 缓存，不影响 LocalConfig

    属性:
        _syncer: ConfigSync 实例，执行实际的同步操作
        _local_config_path: LocalConfig 文件路径
        _logger: 日志记录器
    """

    LOCAL_CONFIG_FILENAME = "local_config.json"

    def __init__(
        self,
        syncer: ConfigSync,
        config_dir: Path,
        logger: "Logger",
    ) -> None:
        self._syncer = syncer
        self._local_config_path = Path(config_dir) / self.LOCAL_CONFIG_FILENAME
        self._logger = logger

    def sync(self, access_token: str, config_id: str | None = None) -> ServerConfig:
        """同步服务端配置，仅返回服务端开关。

        参数:
            access_token: 有效的访问令牌
            config_id: 关联的配置 ID（可选，用于服务端多配置场景）
        返回:
            最新的 ServerConfig 对象
        """
        new_config = self._syncer.sync(access_token, config_id)
        cached = self._syncer.get_cached_config()

        self._logger.info(
            task_id="config", module="配置管理",
            message=(
                f"服务端配置详情 | version={new_config.version} "
                f"clip_mode={new_config.clip_mode.mode} "
                f"img_video_position={new_config.clip_mode.img_video_position} "
                f"frame_extraction={new_config.video_items.frame_extraction} "
                f"cropping={new_config.video_items.cropping} "
                f"blur={new_config.video_items.blur} "
                f"shake={new_config.video_items.shake} "
                f"watermark={new_config.video_items.watermark} "
                f"brightness={new_config.video_items.brightness} "
                f"contrast={new_config.video_items.contrast} "
                f"saturation={new_config.video_items.saturation} "
                f"color_balance={new_config.video_items.color_balance} "
                f"gamma={new_config.video_items.gamma} "
                f"vintage_bw={new_config.video_items.vintage_bw} "
                f"subtitles={new_config.text_items.subtitles} "
                f"danmaku={new_config.text_items.danmaku} "
                f"sticker={new_config.text_items.sticker_enabled} "
                f"prepend={new_config.affix.prepend_enabled} "
                f"append={new_config.affix.append_enabled} "
                f"bgm={new_config.audio.background_music_enabled} "
                f"speed={new_config.audio.speed_adjustment_enabled} "
                f"pitch={new_config.audio.pitch_enabled} "
                f"loop={new_config.repetition.loop_count} "
                f"img_duration={new_config.clip_duration.default_duration_per_image}s"
            ),
        )

        if cached is None:
            self._logger.info(
                task_id="config", module="配置管理",
                message="首次同步，版本: %d" % new_config.version,
            )
            return new_config

        if cached.version == new_config.version:
            self._logger.info(
                task_id="config", module="配置管理",
                message="版本未变更 (v%d)" % new_config.version,
            )
            return new_config

        self._logger.info(
            task_id="config", module="配置管理",
            message="配置已更新 (v%d → v%d)" % (cached.version, new_config.version),
        )
        return new_config

    def load_local_config(self) -> LocalConfig:
        """加载客户端本地配置。

        返回:
            LocalConfig 对象，文件不存在时返回默认配置
        """
        return LocalConfig.load(self._local_config_path)

    def save_local_config(self, config: LocalConfig) -> None:
        """保存客户端本地配置到文件。

        参数:
            config: 待保存的 LocalConfig
        """
        config.save(self._local_config_path)
        if self._logger:
            self._logger.info(
                task_id="config", module="配置管理",
                message="本地配置已保存: %s" % self._local_config_path,
            )