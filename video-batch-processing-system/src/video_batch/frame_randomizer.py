"""帧随机化器 - 为视频效果生成随机参数。

FrameRandomizer 类根据配置随机化视频处理参数：
  - 抽帧：随机选择跳过的帧索引
  - 裁剪：随机决定裁剪百分比
  - 模糊：随机设置模糊强度
  - 抖动：随机生成抖动偏移量

所有随机值在配置的范围内生成，支持注入自定义 RNG 以便测试。
"""
import random
from dataclasses import dataclass
from typing import TYPE_CHECKING

from video_batch.randomization_config import FrameRandomRangeConfig

if TYPE_CHECKING:
    from video_batch.logger import Logger


@dataclass
class FrameRandomizationConfig:
    """帧随机化开关配置。

    属性:
        drop_frame: 是否启用抽帧效果
        crop: 是否启用裁剪效果
        blur: 是否启用模糊效果
        shake: 是否启用抖动效果
        brightness: 是否启用亮度调整
        contrast: 是否启用对比度调整
        saturation: 是否启用饱和度调整
    """
    drop_frame: bool = True
    crop: bool = True
    blur: bool = True
    shake: bool = True
    brightness: bool = True
    contrast: bool = True
    saturation: bool = True
    color_balance: bool = True
    gamma: bool = True
    vintage_bw: bool = True


@dataclass
class AppliedRandomization:
    """实际应用的随机化参数。

    记录 build_filters() 生成的具体随机值，用于日志和调试。

    属性:
        drop_frame_index: 跳过的帧索引
        crop_pct: 裁剪百分比
        blur_strength: 模糊强度
        shake_pct: 抖动偏移百分比
        brightness: 亮度值
        contrast: 对比度值
        saturation: 饱和度值
    """
    drop_frame_index: int | None = None
    crop_pct: float | None = None
    blur_strength: float | None = None
    shake_pct: float | None = None
    brightness: float | None = None
    contrast: float | None = None
    saturation: float | None = None
    color_balance_r: float | None = None
    color_balance_g: float | None = None
    color_balance_b: float | None = None
    gamma: float | None = None
    vintage_bw: float | None = None


class FrameRandomizer:
    """帧随机化器，为视频效果生成随机 FFmpeg 滤镜参数。

    该类根据配置随机化视频处理参数，确保每次处理的视频效果略有不同。
    支持注入自定义 random.Random 实例，便于测试和重现。

    属性:
        _config: 随机化开关配置
        _rng: 随机数生成器
        _logger: 日志记录器（可选）
        _applied: 最近一次生成的随机参数
        _range: 随机值范围配置
    """

    def __init__(
        self,
        config: FrameRandomizationConfig,
        rng: random.Random | None = None,
        logger: "Logger | None" = None,
        range_config: FrameRandomRangeConfig | None = None,
    ) -> None:
        """初始化帧随机化器。

        参数:
            config: 随机化开关配置
            rng: 随机数生成器（默认使用 random.Random()）
            logger: 日志记录器（可选）
            range_config: 随机值范围配置（默认使用 FrameRandomRangeConfig）
        """
        self._config = config
        self._rng = rng if rng is not None else random.Random()
        self._logger = logger
        self._applied = AppliedRandomization()
        self._range = range_config if range_config is not None else FrameRandomRangeConfig()

    def build_filters(self) -> list[str]:
        """构建随机化的视频滤镜列表。

        根据配置开关和随机范围，生成 FFmpeg 滤镜字符串：
          - 抽帧滤镜：select='not(eq(n, idx)),setpts=...'
          - 裁剪滤镜：crop=iw*f:ih*f:ox:oy
          - 模糊滤镜：boxblur=strength:1
          - 抖动滤镜：crop 偏移模拟抖动

        返回:
            FFmpeg 滤镜字符串列表
        """
        filters: list[str] = []
        self._applied = AppliedRandomization()

        if self._config.drop_frame:
            # 随机抽帧：在范围内选择跳过的帧索引
            idx = self._rng.randint(
                self._range.drop_frame_min, self._range.drop_frame_max,
            )
            self._applied.drop_frame_index = idx
            filters.append("select='not(eq(n\\, %d))'" % idx)
            filters.append("setpts=N/FRAME_RATE/TB")

        if self._config.crop:
            # 随机裁剪：在范围内选择裁剪百分比
            pct = self._rng.uniform(
                self._range.crop_pct_min, self._range.crop_pct_max,
            )
            self._applied.crop_pct = round(pct, 3)
            factor = 1.0 - pct / 100.0
            filters.append(
                "crop=iw*%.4f:ih*%.4f:iw*%.4f:ih*%.4f"
                % (factor, factor, (1 - factor) / 2, (1 - factor) / 2),
            )

        if self._config.blur:
            # 随机模糊：在范围内选择模糊强度
            strength = self._rng.uniform(
                self._range.blur_strength_min, self._range.blur_strength_max,
            )
            self._applied.blur_strength = round(strength, 3)
            filters.append("boxblur=%.3f:1" % strength)

        if self._config.shake:
            # 随机抖动：在范围内选择抖动百分比
            pct = self._rng.uniform(
                self._range.shake_pct_min, self._range.shake_pct_max,
            )
            self._applied.shake_pct = round(pct, 3)
            shift_x = pct / 100.0
            shift_y = pct / 100.0
            filters.append(
                "crop=iw*(1-%.4f):ih*(1-%.4f):iw*%.4f:ih*%.4f"
                % (shift_x, shift_y, shift_x / 2, shift_y / 2),
            )

        if self._config.brightness or self._config.contrast or self._config.saturation or self._config.gamma:
            # 色彩调整 + 伽马值：合并为一次 eq 滤镜调用
            eq_parts: list[str] = []
            if self._config.brightness:
                val = self._rng.uniform(self._range.bright_min, self._range.bright_max)
                self._applied.brightness = round(val, 3)
                eq_parts.append("brightness=%.3f" % val)
            if self._config.contrast:
                val = self._rng.uniform(self._range.contrast_min, self._range.contrast_max)
                self._applied.contrast = round(val, 3)
                eq_parts.append("contrast=%.3f" % val)
            if self._config.saturation:
                val = self._rng.uniform(self._range.saturation_min, self._range.saturation_max)
                self._applied.saturation = round(val, 3)
                eq_parts.append("saturation=%.3f" % val)
            if self._config.gamma:
                val = self._rng.uniform(self._range.gamma_min, self._range.gamma_max)
                self._applied.gamma = round(val, 3)
                eq_parts.append("gamma=%.3f" % val)
            filters.append("eq=%s" % ":".join(eq_parts))

        if self._config.color_balance:
            # 色彩平衡：R/G/B 三通道独立随机偏移
            r = self._rng.uniform(self._range.color_balance_min, self._range.color_balance_max)
            g = self._rng.uniform(self._range.color_balance_min, self._range.color_balance_max)
            b = self._rng.uniform(self._range.color_balance_min, self._range.color_balance_max)
            self._applied.color_balance_r = round(r, 3)
            self._applied.color_balance_g = round(g, 3)
            self._applied.color_balance_b = round(b, 3)
            filters.append("colorbalance=rs=%.3f:gs=%.3f:bs=%.3f" % (r, g, b))

        if self._config.vintage_bw:
            # 复古黑白：去色 + 根据强度调整曲线
            # curves 滤镜要求 x、y 坐标在 [0, 1] 范围内
            val = self._rng.uniform(self._range.vintage_bw_min, self._range.vintage_bw_max)
            curve_val = max(0.0, min(1.0, val))
            self._applied.vintage_bw = round(curve_val, 3)
            filters.append("hue=s=0")
            filters.append("curves=all=0/0\\ 0.5/%.3f\\ 1/1" % curve_val)

        if self._logger:
            self._logger.info(
                task_id="randomizer",
                module="画面随机化",
                message="随机化参数: %s" % str(self._applied),
            )

        return filters

    def get_applied_params(self) -> AppliedRandomization:
        """获取最近一次应用的随机化参数。

        返回:
            AppliedRandomization 对象，包含上次 build_filters() 生成的随机值
        """
        return self._applied