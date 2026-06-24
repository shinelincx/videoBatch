"""配置同步模块 - 处理服务端配置获取、解析和本地缓存。

提供以下功能：
  - ServerConfig 及其子配置类（冻结 dataclass），定义服务端开关配置
  - ConfigSync 类，负责从服务端获取配置、本地 JSON 缓存、解析和回滚
  - 配置解析失败时自动回滚到上一版本

服务端仅下发功能开关（启用/禁用），不包含参数值。
参数值（素材路径、随机化范围、音频参数）由客户端 LocalConfig 管理。
"""
import hashlib
import json
import secrets
import time
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING
from urllib.parse import urlparse

if TYPE_CHECKING:
    from video_batch.logger import Logger

_SIGN_KEY = "s.0wl?.i_s43$i1_"


class ConfigParseError(Exception):
    """配置解析异常，JSON 结构不符合预期时抛出。"""
    pass


class ConfigSyncError(Exception):
    """配置同步异常，网络获取失败且无缓存时抛出。"""
    pass


def _parse_transition_settings(data: dict) -> dict:
    clip_mode = data.get("clip_mode", {})
    video_items = data.get("video_items", {})
    raw = (
        data.get("transition")
        if "transition" in data
        else clip_mode.get("transition", video_items.get("transition"))
    )

    enabled = False
    duration = 0.5
    types: tuple[str, ...] | None = None

    if isinstance(raw, dict):
        enabled = bool(raw.get("enabled", raw.get("random", False)))
        duration = float(raw.get("duration", raw.get("transition_duration", duration)))
        raw_types = raw.get("types", raw.get("transition_types"))
        if raw_types:
            types = tuple(str(item) for item in raw_types)
    elif raw is not None:
        enabled = bool(raw)

    for source in (clip_mode, video_items, data):
        if "transition_enabled" in source:
            enabled = bool(source["transition_enabled"])
        if "random_transition" in source:
            enabled = bool(source["random_transition"])
        if "transition_duration" in source:
            duration = float(source["transition_duration"])
        raw_types = source.get("transition_types")
        if raw_types:
            types = tuple(str(item) for item in raw_types)

    return {"enabled": enabled, "duration": duration, "types": types}


# ============================================================
# 服务端配置数据类（冻结，不可变）—— 仅包含功能开关
# ============================================================

@dataclass(frozen=True)
class ClipModeConfig:
    """剪辑模式配置。

    属性:
        mode: 剪辑模式名称（如 "image-to-video", "reference-video"）
        img_video_position: 图片视频拼接位置，仅参考生视频模式有效；
            "before" 拼在参考视频前，"after" 拼在参考视频后，"none" 不拼接
    """

    mode: str
    img_video_position: str = "after"
    transition_enabled: bool = False
    transition_duration: float = 0.5
    transition_types: tuple[str, ...] | None = None


@dataclass(frozen=True)
class VideoItemConfig:
    """视频效果开关配置。

    属性:
        frame_extraction: 抽帧效果
        cropping: 边缘裁剪
        blur: 模糊效果
        shake: 抖动效果
        watermark: 水印效果
        brightness: 亮度调整
        contrast: 对比度调整
        saturation: 饱和度调整
        color_balance: 色彩平衡
        gamma: 伽马值调整
        vintage_bw: 复古黑白效果
    """

    frame_extraction: bool
    cropping: bool
    blur: bool
    shake: bool
    watermark: bool
    brightness: bool = False
    contrast: bool = False
    saturation: bool = False
    color_balance: bool = False
    gamma: bool = False
    vintage_bw: bool = False


@dataclass(frozen=True)
class TextItemConfig:
    """文本效果开关配置。

    属性:
        subtitles: 是否启用字幕
        danmaku: 是否启用弹幕
        sticker_enabled: 是否启用贴纸
    """

    subtitles: bool
    danmaku: bool
    sticker_enabled: bool = False


@dataclass(frozen=True)
class AudioToggleConfig:
    """音频功能开关配置（服务端仅控制启/禁，参数由客户端本地配置管理）。

    属性:
        background_music_enabled: 是否启用背景音乐混音
        speed_adjustment_enabled: 是否启用语速调整
        pitch_enabled: 是否启用变调处理（具体变调值由本地配置随机范围决定）
    """

    background_music_enabled: bool
    speed_adjustment_enabled: bool
    pitch_enabled: bool = False


@dataclass(frozen=True)
class AffixToggleConfig:
    """前后贴功能开关配置（服务端仅控制启/禁，目录路径由客户端本地配置管理）。

    属性:
        prepend_enabled: 是否启用前贴视频
        append_enabled: 是否启用后贴视频
    """

    prepend_enabled: bool
    append_enabled: bool


@dataclass(frozen=True)
class RepetitionConfig:
    """重复处理配置。

    属性:
        loop_count: 循环次数（生成多少个变体版本）
    """

    loop_count: int


@dataclass(frozen=True)
class ClipDurationConfig:
    """剪辑时长配置。

    属性:
        default_duration_per_image: 每张图片的默认播放时长（秒）
    """

    default_duration_per_image: float = 5.0


@dataclass(frozen=True)
class ServerConfig:
    """服务端配置 — 由 /clip_config/config_map 接口下发，仅包含功能开关。

    与客户端本地配置（LocalConfig）分离：
      - ServerConfig: 服务端控制的功能启/禁开关
      - LocalConfig:  客户端本地的参数值（素材路径、随机化范围、音频参数等）
    """

    version: int
    clip_mode: ClipModeConfig
    video_items: VideoItemConfig
    text_items: TextItemConfig
    affix: AffixToggleConfig
    audio: AudioToggleConfig
    repetition: RepetitionConfig
    clip_duration: ClipDurationConfig
    subtitles_mode: str = "text"

    @staticmethod
    def from_dict(data: dict) -> "ServerConfig":
        try:
            version = data["version"]
            clip_mode_data = data["clip_mode"]
            transition = _parse_transition_settings(data)
            clip_mode = ClipModeConfig(
                mode=clip_mode_data["mode"],
                img_video_position=clip_mode_data.get("img_video_position", "after"),
                transition_enabled=transition["enabled"],
                transition_duration=transition["duration"],
                transition_types=transition["types"],
            )
            video_data = data["video_items"]
            video_items = VideoItemConfig(
                frame_extraction=video_data["frame_extraction"],
                cropping=video_data["cropping"],
                blur=video_data["blur"],
                shake=video_data["shake"],
                watermark=video_data["watermark"],
                brightness=video_data.get("brightness", False),
                contrast=video_data.get("contrast", False),
                saturation=video_data.get("saturation", False),
                color_balance=video_data.get("color_balance", False),
                gamma=video_data.get("gamma", False),
                vintage_bw=video_data.get("vintage_bw", False),
            )
            text_data = data["text_items"]
            text_items = TextItemConfig(
                subtitles=text_data["subtitles"],
                danmaku=text_data["danmaku"],
                sticker_enabled=text_data.get("sticker", False),
            )
            subtitles_mode = str(
                text_data.get("subtitles_mode", data.get("subtitles_mode", "text")),
            ).strip() or "text"
            if subtitles_mode not in ("text", "images"):
                raise ConfigParseError(
                    "subtitles_mode must be 'text' or 'images': %s" % subtitles_mode,
                )
            affix_data = data.get("affix", {})
            affix = AffixToggleConfig(
                prepend_enabled=affix_data.get("prepend_enabled", False),
                append_enabled=affix_data.get("append_enabled", False),
            )
            audio_data = data.get("audio", {})
            audio = AudioToggleConfig(
                background_music_enabled=audio_data.get(
                    "background_music_enabled", False,
                ),
                speed_adjustment_enabled=audio_data.get(
                    "speed_adjustment_enabled", False,
                ),
                pitch_enabled=audio_data.get("pitch_enabled", False),
            )
            repetition_data = data["repetition"]
            repetition = RepetitionConfig(
                loop_count=repetition_data["loop_count"],
            )
            clip_duration_data = data.get("clip_duration", {})
            clip_duration = ClipDurationConfig(
                default_duration_per_image=clip_duration_data.get(
                    "default_duration_per_image", 5.0,
                ),
            )
        except (KeyError, TypeError) as e:
            raise ConfigParseError(f"配置解析失败: {e}") from e

        return ServerConfig(
            version=version,
            clip_mode=clip_mode,
            video_items=video_items,
            text_items=text_items,
            affix=affix,
            audio=audio,
            repetition=repetition,
            clip_duration=clip_duration,
            subtitles_mode=subtitles_mode,
        )

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "clip_mode": {
                "mode": self.clip_mode.mode,
                "img_video_position": self.clip_mode.img_video_position,
                "transition_enabled": self.clip_mode.transition_enabled,
                "transition_duration": self.clip_mode.transition_duration,
                "transition_types": list(self.clip_mode.transition_types)
                if self.clip_mode.transition_types is not None
                else None,
            },
            "video_items": {
                "frame_extraction": self.video_items.frame_extraction,
                "cropping": self.video_items.cropping,
                "blur": self.video_items.blur,
                "shake": self.video_items.shake,
                "watermark": self.video_items.watermark,
                "brightness": self.video_items.brightness,
                "contrast": self.video_items.contrast,
                "saturation": self.video_items.saturation,
                "color_balance": self.video_items.color_balance,
                "gamma": self.video_items.gamma,
                "vintage_bw": self.video_items.vintage_bw,
            },
            "text_items": {
                "subtitles": self.text_items.subtitles,
                "subtitles_mode": self.subtitles_mode,
                "danmaku": self.text_items.danmaku,
                "sticker": self.text_items.sticker_enabled,
            },
            "affix": {
                "prepend_enabled": self.affix.prepend_enabled,
                "append_enabled": self.affix.append_enabled,
            },
            "audio": {
                "background_music_enabled": self.audio.background_music_enabled,
                "speed_adjustment_enabled": self.audio.speed_adjustment_enabled,
                "pitch_enabled": self.audio.pitch_enabled,
                "pitch_mode": "",
            },
            "repetition": {"loop_count": self.repetition.loop_count},
            "clip_duration": {
                "default_duration_per_image": self.clip_duration.default_duration_per_image,
            },
        }


# ============================================================
# 向后兼容：保留 UserConfig 别名和旧的子配置类型
# ============================================================

@dataclass(frozen=True)
class AudioItemConfig:
    """[已废弃] 音频配置 — 请改用 AudioToggleConfig + LocalConfig.audio_params。

    保留仅用于向后兼容，新代码不应使用。
    """

    voice_type: str
    speech_speed: float
    background_music: str | None


@dataclass(frozen=True)
class AffixConfig:
    """[已废弃] 前后贴配置 — 请改用 AffixToggleConfig + LocalConfig 中的路径。

    保留仅用于向后兼容，新代码不应使用。
    """

    prepend_video: str | None
    append_video: str | None


@dataclass(frozen=True)
class MaterialPathsConfig:
    """[已废弃] 素材路径配置 — 请改用 local_config.MaterialPathsConfig。

    保留仅用于向后兼容，新代码不应使用。
    """

    base_dir: str
    image_dir: str
    video_dir: str
    bgm_dir: str
    output_dir: str


UserConfig = ServerConfig


# ============================================================
# 配置同步服务
# ============================================================


class ConfigSync:
    CACHE_FILENAME = "server_config.json"

    def __init__(
        self,
        base_url: str,
        http_session,
        config_dir: Path,
        logger: "Logger | None" = None,
    ) -> None:
        self._base_url = base_url
        self._http = http_session
        self._config_dir = Path(config_dir)
        self._logger = logger
        self._cache_path = self._config_dir / self.CACHE_FILENAME

    def sync(self, access_token: str, config_id: str | None = None) -> ServerConfig:
        full_data = self._fetch_config(access_token, config_id)

        if full_data is None:
            return self._load_cached_or_raise(config_id)

        selected_data, selected_key = self._select_config(full_data, config_id)
        if selected_key and self._logger:
            self._logger.info(
                task_id="config",
                module="配置同步",
                message=f"配置 Map 由服务端返回，共 {len(full_data)} 个配置，选用: {selected_key}",
            )

        try:
            config = ServerConfig.from_dict(selected_data)
        except ConfigParseError as e:
            if self._cache_path.exists():
                if self._logger:
                    self._logger.warning(
                        task_id="config",
                        module="配置同步",
                        message=f"配置解析失败，回滚到上一版本 | 原因: {e}",
                    )
                    self._logger.info(
                        task_id="config",
                        module="配置同步",
                        message=f"原始响应数据: {json.dumps(selected_data, ensure_ascii=False)[:500]}",
                    )
                return self.get_cached_config(config_id)
            raise

        cached_before = self.get_cached_config(config_id)
        self._write_cache_full(full_data)

        if self._logger:
            if cached_before is None:
                self._logger.info(
                    task_id="config",
                    module="配置同步",
                    message=f"首次同步成功，版本: {config.version}",
                )
            elif cached_before.version == config.version:
                self._logger.info(
                    task_id="config",
                    module="配置同步",
                    message=f"配置未变更 (v{config.version})",
                )
            else:
                self._logger.info(
                    task_id="config",
                    module="配置同步",
                    message=f"配置已更新 (v{cached_before.version} → v{config.version})",
                )

        return config

    def get_cached_config(self, config_id: str | None = None) -> ServerConfig | None:
        if not self._cache_path.exists():
            return None
        data = json.loads(self._cache_path.read_text(encoding="utf-8"))
        selected_data, _ = self._select_config(data, config_id)
        try:
            return ServerConfig.from_dict(selected_data)
        except ConfigParseError:
            return None

    def _fetch_config(self, access_token: str, config_id: str | None = None) -> dict | None:
        path = "/clip_config/config_map"
        if config_id:
            path += f"?config_id={config_id}"
        url = f"{self._base_url.rstrip('/')}{path}"
        signed_headers = self._make_signed_headers(path)
        signed_headers["Authorization"] = f"Bearer {access_token}"
        try:
            if self._logger:
                self._logger.info(
                    task_id="config",
                    module="配置同步",
                    message=f"请求服务端配置: GET {url}",
                )
            response = self._http.get(url, headers=signed_headers)
        except Exception as e:
            if self._logger:
                self._logger.info(
                    task_id="config",
                    module="配置同步",
                    message=f"网络异常，使用缓存配置: {e}",
                )
            return None

        if response.status_code != 200:
            body_preview = response.text[:200] if response.text else "(empty)"
            if self._logger:
                self._logger.info(
                    task_id="config",
                    module="配置同步",
                    message=f"HTTP {response.status_code}，使用缓存配置 | 响应: {body_preview}",
                )
            return None

        raw = response.json()
        if self._logger:
            self._logger.info(
                task_id="config",
                module="配置同步",
                message=f"服务端响应原始数据: {json.dumps(raw, ensure_ascii=False)[:800]}",
            )

        if isinstance(raw, dict) and "code" in raw and raw.get("code", 0) != 0:
            err_code = raw.get("code")
            err_msg = raw.get("msg", "未知错误")
            if self._logger:
                self._logger.warning(
                    task_id="config",
                    module="配置同步",
                    message=f"服务端返回业务错误 code={err_code}: {err_msg}，回退缓存配置",
                )
            return None

        return self._unwrap_response(raw)

    def _load_cached_or_raise(self, config_id: str | None = None) -> ServerConfig:
        cached = self.get_cached_config(config_id)
        if cached is not None:
            return cached
        raise ConfigSyncError("无可用缓存配置且配置获取失败")

    @staticmethod
    def _select_config(data: dict, config_id: str | None) -> tuple[dict, str | None]:
        if isinstance(data, dict) and data:
            first_val = next(iter(data.values()), None)
            if isinstance(first_val, dict) and "version" in first_val:
                if config_id and config_id in data:
                    return data[config_id], config_id
                first_key = next(iter(data))
                return data[first_key], first_key
        return data, None

    @staticmethod
    def _make_signed_headers(request_path: str) -> dict[str, str]:
        ts = str(int(time.time() * 1000))
        nonce = secrets.token_hex(12)
        parsed = urlparse(request_path)
        uri = parsed.path or "/"
        if uri.startswith("/api/"):
            uri = uri[4:]
        params = {"timestamp": ts, "nonceStr": nonce, "uri": uri}
        sign_str = "&".join(f"{k}={params[k]}" for k in sorted(params))
        signature = hashlib.md5(f"{sign_str}&key={_SIGN_KEY}".encode()).hexdigest()
        return {
            "signature": signature.lower(),
            "timestamp": ts,
            "nonceStr": nonce,
            "uri": uri,
        }

    @staticmethod
    def _unwrap_response(body: dict) -> dict:
        if isinstance(body, dict) and "code" in body and "data" in body:
            data = body.get("data")
            if isinstance(data, dict):
                return data
        return body

    def _write_cache_full(self, data: dict) -> None:
        self._config_dir.mkdir(parents=True, exist_ok=True)
        self._cache_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
