"""
音频处理模块 - 背景音乐、语速调整和变调处理

负责为视频添加背景音乐、随机调整语速、通过 rubberband 滤镜进行变调处理，
支持多音轨混合。通过 FFmpeg 音频过滤器实现音量调节、语速变换和音调偏移。
"""

import random
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

from video_batch.randomization_config import AudioRandomConfig, MediaFormatsConfig

if TYPE_CHECKING:
    from video_batch.logger import Logger


# 默认支持的音频格式集合
_DEFAULT_AUDIO_FORMATS = {"mp3", "wav", "aac", "ogg", "m4a", "flac", "wma"}


@dataclass
class AudioProcessingConfig:
    """音频处理功能配置"""
    background_music: bool = True                       # 是否启用背景音乐
    speed_adjustment: bool = True                       # 是否启用语速调整
    pitch_enabled: bool = False                         # 是否启用变调处理
    bgm_volume_range: tuple[float, float] = (0.08, 0.18) # 背景音乐音量范围
    speed_range: tuple[float, float] = (0.90, 1.10)     # 语速调整范围（0.85x ~ 1.15x）


@dataclass
class AppliedAudioParams:
    """实际应用的音频处理参数记录"""
    bgm_file: str | None = None     # 使用的背景音乐文件名
    bgm_volume: float | None = None # 背景音乐音量
    speech_speed: float | None = None # 语音播放速度
    pitch_shift: float | None = None # pitch 偏移半音数


class AudioProcessor:
    """
    音频处理器

    根据配置随机选择背景音乐、调整语速、应用变调处理，
    生成 FFmpeg 音频过滤器链。
    支持背景音乐混音、语速变速、变调或任意组合处理。
    变调通过 rubberband 滤镜在 BGM 混音之前应用到原音频流。
    """

    def __init__(
        self,
        config: AudioProcessingConfig,            # 音频处理功能配置
        rng: random.Random | None = None,          # 随机数生成器
        logger: "Logger | None" = None,            # 日志记录器
        formats_config: MediaFormatsConfig | None = None, # 支持的音频格式配置
        random_config: AudioRandomConfig | None = None,  # 语速/变调随机范围配置
    ) -> None:
        self._config = config
        self._rng = rng if rng is not None else random.Random()
        self._logger = logger
        self._applied = AppliedAudioParams()
        self._formats = formats_config if formats_config is not None else MediaFormatsConfig()
        self._random_config = random_config

    def build(self, bgm_dir: str) -> tuple[list[str], list[str]]:
        """
        构建音频处理过滤器链

        根据配置随机选择背景音乐和语速参数，生成对应的 FFmpeg 音频过滤器。

        参数:
            bgm_dir: 背景音乐文件目录路径

        返回:
            元组 (filters, extra_inputs)：
            - filters: FFmpeg 音频过滤器表达式列表
            - extra_inputs: 额外输入文件参数列表（如背景音乐文件）
        """
        filters: list[str] = []
        extra_inputs: list[str] = []
        self._applied = AppliedAudioParams()

        bgm_path: str | None = None
        bgm_volume: float | None = None

        # 处理背景音乐
        if self._config.background_music:
            bgm_path = self._pick_bgm(bgm_dir)
            if bgm_path is not None:
                # 随机生成背景音乐音量
                bgm_volume = round(
                    self._rng.uniform(*self._config.bgm_volume_range), 3,
                )
                self._applied.bgm_file = Path(bgm_path).name
                self._applied.bgm_volume = bgm_volume
                extra_inputs.extend(["-i", bgm_path])

        # 处理语速调整
        speed: float | None = None
        if self._config.speed_adjustment:
            if self._random_config is not None:
                speed = round(
                    self._rng.uniform(
                        self._random_config.speed_min,
                        self._random_config.speed_max,
                    ), 3,
                )
            else:
                speed = round(self._rng.uniform(*self._config.speed_range), 3)
            self._applied.speech_speed = speed

        # 处理变调（在语速调整和 BGM 混音之前）
        pitch_shift: float | None = None
        pitch_ratio: float | None = None
        if self._config.pitch_enabled:
            if self._random_config is not None:
                pitch_shift = round(
                    self._rng.uniform(
                        self._random_config.pitch_semitones_min,
                        self._random_config.pitch_semitones_max,
                    ), 4,
                )
            else:
                pitch_shift = 0.0
            self._applied.pitch_shift = pitch_shift
            # rubberband pitch 参数是倍率（1.0=原调），需从半音数转换
            pitch_ratio = round(float(2 ** (pitch_shift / 12)), 4)

        # 根据是否启用背景音乐和语速调整，生成对应的过滤器链
        has_bgm = bgm_path is not None
        has_speed = speed is not None
        has_pitch = pitch_shift is not None

        if has_pitch and has_speed and has_bgm:
            # 变调 + 语速 + BGM：rubberband → atempo → amix
            filters.append("[0:a]rubberband=pitch=%.4f[pitch]" % pitch_ratio)
            filters.append("[pitch]atempo=%.3f[speed]" % speed)
            filters.append("[1:a]volume=%.3f[bgm]" % bgm_volume)
            filters.append("[speed][bgm]amix=inputs=2:duration=first")
        elif has_pitch and has_speed:
            # 变调 + 语速：rubberband → atempo
            filters.append("[0:a]rubberband=pitch=%.4f[pitch]" % pitch_ratio)
            filters.append("[pitch]atempo=%.3f" % speed)
        elif has_pitch and has_bgm:
            # 变调 + BGM：rubberband → amix
            filters.append("[0:a]rubberband=pitch=%.4f[pitch]" % pitch_ratio)
            filters.append("[1:a]volume=%.3f[bgm]" % bgm_volume)
            filters.append("[pitch][bgm]amix=inputs=2:duration=first")
        elif has_pitch:
            # 仅变调
            filters.append("rubberband=pitch=%.4f" % pitch_ratio)
        elif has_speed and has_bgm:
            # 同时处理语速和背景音乐：先分别处理再混合
            filters.append("[0:a]atempo=%.3f[speed]" % speed)
            filters.append("[1:a]volume=%.3f[bgm]" % bgm_volume)
            filters.append("[speed][bgm]amix=inputs=2:duration=first")
        elif has_speed:
            # 仅调整语速
            filters.append("atempo=%.3f" % speed)
        elif has_bgm:
            # 仅添加背景音乐
            filters.append("[1:a]volume=%.3f[bgm]" % bgm_volume)
            filters.append("[0:a][bgm]amix=inputs=2:duration=first")

        # 记录处理结果到日志
        if self._logger:
            self._logger.info(
                task_id="audio",
                module="音频处理",
                message="音频参数: %s" % str(self._applied),
            )

        return filters, extra_inputs

    def get_applied_params(self) -> AppliedAudioParams:
        """
        获取实际应用的音频参数

        返回:
            AppliedAudioParams: 包含所有实际应用参数的数据类实例
        """
        return self._applied

    def _pick_bgm(self, bgm_dir: str) -> str | None:
        """
        从指定目录随机选择一个背景音乐文件

        参数:
            bgm_dir: 背景音乐文件目录路径

        返回:
            随机选择的音频文件绝对路径，目录无效或无可用文件时返回 None
        """
        bgm_path = Path(bgm_dir)
        # 检查目录是否存在
        if not bgm_path.exists() or not bgm_path.is_dir():
            return None
        # 筛选支持的音频格式文件
        formats = self._formats.audio_formats
        files = [
            str(f.resolve())
            for f in sorted(bgm_path.iterdir())
            if f.is_file() and f.suffix.lstrip(".").lower() in formats
        ]
        if not files:
            return None
        return self._rng.choice(files)
