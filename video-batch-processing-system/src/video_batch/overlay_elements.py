"""
叠加元素模块 - 视频水印、字幕、弹幕等叠加元素处理

负责根据配置随机生成水印、字幕和弹幕的 FFmpeg 过滤器参数，
用于视频后期处理中的画面叠加效果。
"""

import os
import random
from dataclasses import dataclass
from typing import TYPE_CHECKING

from video_batch.randomization_config import OverlayRandomConfig

if TYPE_CHECKING:
    from video_batch.logger import Logger


@dataclass
class OverlayConfig:
    """叠加元素功能开关配置"""
    watermark_enabled: bool = True  # 是否启用水印
    subtitle_enabled: bool = True   # 是否启用字幕
    danmaku_enabled: bool = True    # 是否启用弹幕
    sticker_enabled: bool = True    # 是否启用贴纸


@dataclass
class AppliedOverlayParams:
    """实际应用的叠加元素参数记录"""
    watermark_file: str | None = None          # 使用的水印文件名
    watermark_transparency: float | None = None # 水印透明度
    watermark_motion_x_expr: str | None = None  # 水印 X 轴运动表达式
    watermark_motion_y_expr: str | None = None  # 水印 Y 轴运动表达式
    subtitle_text: str | None = None           # 字幕文本
    subtitle_font_size: int | None = None      # 字幕字体大小
    subtitle_color: str | None = None          # 字幕颜色
    subtitle_x: str | None = None              # 字幕 X 坐标
    subtitle_y: str | None = None              # 字幕 Y 坐标
    danmaku_texts: list[str] | None = None     # 弹幕文本列表
    danmaku_font_size: int | None = None       # 弹幕字体大小
    danmaku_color: str | None = None           # 弹幕颜色
    danmaku_speed: int | None = None           # 弹幕移动速度
    sticker_files: list[str] | None = None     # 贴纸文件名列表
    sticker_count: int | None = None           # 贴纸数量
    sticker_transparencies: list[float] | None = None  # 贴纸透明度列表
    sticker_motion_x_exprs: list[str] | None = None    # 贴纸 X 轴运动表达式
    sticker_motion_y_exprs: list[str] | None = None    # 贴纸 Y 轴运动表达式


class OverlayElementBuilder:
    """叠加元素构建器

    根据配置和随机参数生成 FFmpeg 过滤器链，支持水印、字幕和弹幕三种叠加元素。
    构建结果包含 FFmpeg 过滤器表达式和额外输入文件路径。

    水印目录通过构造函数注入（来自 LocalConfig），不再作为 build() 参数传递。
    """

    def __init__(
        self,
        config: OverlayConfig,
        watermark_dir: str | None = None,
        sticker_dir: str | None = None,
        rng: random.Random | None = None,
        logger: "Logger | None" = None,
        range_config: OverlayRandomConfig | None = None,
    ) -> None:
        self._config = config
        self._watermark_dir = watermark_dir
        self._sticker_dir = sticker_dir
        self._rng = rng if rng is not None else random.Random()
        self._logger = logger
        self._applied = AppliedOverlayParams()
        self._range = range_config if range_config is not None else OverlayRandomConfig()

    def set_video_info(self, width: int, height: int, duration_sec: float) -> None:
        """
        设置视频基础信息

        参数:
            width: 视频宽度（像素）
            height: 视频高度（像素）
            duration_sec: 视频时长（秒）
        """
        self._width = width
        self._height = height
        self._duration = duration_sec

    def build(self, video_base_label: str = "0:v") -> tuple[list[str], list[str]]:
        """构建叠加元素过滤器链。

        根据配置依次构建水印、字幕、弹幕的 FFmpeg 过滤器参数。
        水印/贴纸目录在构造函数中注入，此方法不再接收外部参数。
        水印叠加输出带标签 [wm_out]，贴纸叠加以此为基底线向后链式引用。

        参数:
            video_base_label: 视频基底线标签，默认 "0:v"，
                              当上游存在视频效果滤镜链时传入 "[v_base]"

        返回:
            元组 (filters, inputs)：
            - filters: FFmpeg 过滤器表达式列表
            - inputs: 额外输入文件参数列表
        """
        self._applied = AppliedOverlayParams()
        filters: list[str] = []
        inputs: list[str] = []

        baseline = video_base_label
        if self._config.watermark_enabled and self._watermark_dir:
            self._build_watermark(filters, inputs, baseline)
            baseline = "wm_out"

        if self._config.subtitle_enabled:
            self._build_subtitle(filters)

        if self._config.danmaku_enabled:
            self._build_danmaku(filters)

        if self._config.sticker_enabled and self._sticker_dir:
            self._build_stickers(filters, inputs, baseline)

        if self._logger:
            self._logger.info(
                task_id="overlay",
                module="叠加元素",
                message="叠加参数: %s" % str(self._applied),
            )

        return filters, inputs

    def _build_stickers(
        self, filters: list[str], inputs: list[str], baseline_label: str = "0:v",
    ) -> None:
        """构建贴纸过滤器。

        从贴纸目录随机选择 1-4 个贴纸，分配到视频 4 个角（左上/右上/左下/右下），
        每个贴纸设置随机透明度和小范围运动轨迹。贴纸以 baseline_label 为基底线链式叠加。

        参数:
            filters: 过滤器列表（输出参数）
            inputs: 输入文件列表（输出参数）
            baseline_label: 叠加基线流标签（"0:v" 或水印输出 "wm_out"）
        """
        if not self._sticker_dir:
            return
        sticker_files = [
            f for f in os.listdir(self._sticker_dir)
            if f.lower().endswith((".png", ".webp"))
        ]
        if not sticker_files:
            return

        count = self._rng.randint(1, 4)
        corners = [
            ("左上", 0.0, 0.25, 0.0, 0.25),
            ("右上", 0.75, 1.0, 0.0, 0.25),
            ("左下", 0.0, 0.25, 0.75, 1.0),
            ("右下", 0.75, 1.0, 0.75, 1.0),
        ]
        chosen_corners = self._rng.sample(corners, min(count, len(corners)))

        input_idx = len(inputs) // 2
        src_label = baseline_label

        chosen_files: list[str] = []
        transparencies: list[float] = []
        x_exprs: list[str] = []
        y_exprs: list[str] = []

        for i, (corner_name, x_min, x_max, y_min, y_max) in enumerate(chosen_corners):
            sf = self._rng.choice(sticker_files)
            sp = os.path.join(self._sticker_dir, sf)

            transparency = round(
                self._rng.uniform(0.7, 0.9), 3,
            )

            x_start = round(self._rng.uniform(x_min + 0.02, x_max - 0.02), 3)
            y_start = round(self._rng.uniform(y_min + 0.02, y_max - 0.02), 3)
            motion_amp = round(self._rng.uniform(0.01, 0.04), 3)
            motion_speed = round(self._rng.uniform(0.3, 0.8), 2)
            phase = self._rng.uniform(0, 2 * 3.14159)

            x_expr = "(main_w-overlay_w)*({x0:.3f}+{amp:.3f}*sin({spd:.2f}*t+{ph:.2f}))".format(
                x0=x_start, amp=motion_amp, spd=motion_speed, ph=phase,
            )
            y_expr = "(main_h-overlay_h)*({y0:.3f}+{amp:.3f}*cos({spd:.2f}*t+{ph:.2f}))".format(
                y0=y_start, amp=motion_amp, spd=motion_speed, ph=phase + 1.57,
            )

            chosen_files.append(sf)
            transparencies.append(transparency)
            x_exprs.append(x_expr)
            y_exprs.append(y_expr)

            inputs.extend(["-i", sp])

            current_input_idx = input_idx + i + 1
            alpha_label = "a%d" % current_input_idx
            is_last = (i == len(chosen_corners) - 1)
            vo_label = "" if is_last else "[vo%d]" % current_input_idx

            filters.append(
                "[{iidx}:v]format=rgba,colorchannelmixer=aa={alpha:.3f}[{alpha_label}];"
                "[{src}][{alpha_label}]overlay=x={x}:y={y}{vo}".format(
                    iidx=current_input_idx, alpha_label=alpha_label,
                    src=src_label,
                    alpha=transparency, x=x_expr, y=y_expr,
                    vo=vo_label,
                ),
            )
            if not is_last:
                src_label = "vo%d" % current_input_idx

        self._applied.sticker_files = chosen_files
        self._applied.sticker_count = count
        self._applied.sticker_transparencies = transparencies
        self._applied.sticker_motion_x_exprs = x_exprs
        self._applied.sticker_motion_y_exprs = y_exprs

    def _build_watermark(
        self, filters: list[str], inputs: list[str], video_base_label: str = "0:v",
    ) -> None:
        """构建水印过滤器。

        从构造函数注入的水印目录随机选择 PNG 文件，生成带透明度控制的 overlay 过滤器链。
        使用 format=rgba + colorchannelmixer=aa 预乘 alpha 通道。
        运动轨迹：随机初始位置 + 正弦/余弦振荡，振幅按屏幕百分比换算，
        运动范围覆盖全屏幕，不越界。
        输出标签 [wm_out] 供后续贴纸叠加链式引用。

        参数:
            filters: 过滤器列表（输出参数）
            inputs: 输入文件列表（输出参数）
            video_base_label: 视频基底线标签（"0:v" 或 "[v_base]"）
        """
        if not self._watermark_dir:
            return
        wm_files = [f for f in os.listdir(self._watermark_dir) if f.lower().endswith(".png")]
        if not wm_files:
            return

        wm_file = self._rng.choice(wm_files)
        wm_path = os.path.join(self._watermark_dir, wm_file)
        transparency = round(
            self._rng.uniform(
                self._range.watermark_transparency_min,
                self._range.watermark_transparency_max,
            ),
            3,
        )

        speed_x = self._rng.uniform(
            self._range.watermark_motion_speed_x_min,
            self._range.watermark_motion_speed_x_max,
        )
        speed_y = self._rng.uniform(
            self._range.watermark_motion_speed_y_min,
            self._range.watermark_motion_speed_y_max,
        )
        start_x_pct = round(self._rng.uniform(0.05, 0.95), 3)
        start_y_pct = round(self._rng.uniform(0.05, 0.95), 3)
        max_amp_x = min(start_x_pct, 1.0 - start_x_pct)
        max_amp_y = min(start_y_pct, 1.0 - start_y_pct)
        amp_x_pct = round(self._rng.uniform(0.05, max(max_amp_x, 0.05)), 3)
        amp_y_pct = round(self._rng.uniform(0.05, max(max_amp_y, 0.05)), 3)
        phase_x = self._rng.uniform(0, 2 * 3.14159)
        phase_y = self._rng.uniform(0, 2 * 3.14159)

        x_expr = "(main_w-overlay_w)*({start_x:.3f}+{amp_x:.3f}*sin({speed_x:.2f}*t+{phase_x:.2f}))".format(
            start_x=start_x_pct, amp_x=amp_x_pct,
            speed_x=speed_x, phase_x=phase_x,
        )
        y_expr = "(main_h-overlay_h)*({start_y:.3f}+{amp_y:.3f}*cos({speed_y:.2f}*t+{phase_y:.2f}))".format(
            start_y=start_y_pct, amp_y=amp_y_pct,
            speed_y=speed_y, phase_y=phase_y,
        )

        self._applied.watermark_file = wm_file
        self._applied.watermark_transparency = transparency
        self._applied.watermark_motion_x_expr = x_expr
        self._applied.watermark_motion_y_expr = y_expr

        inputs.extend(["-i", wm_path])

        filters.append(
            "[1:v]format=rgba,colorchannelmixer=aa={alpha:.3f}[wm];[{base}][wm]overlay=x={x}:y={y}[wm_out]".format(
                alpha=transparency, base=video_base_label, x=x_expr, y=y_expr,
            ),
        )

    def _build_subtitle(self, filters: list[str]) -> None:
        """
        构建字幕过滤器

        生成随机位置、颜色和大小的静态字幕文本。

        参数:
            filters: 过滤器列表（输出参数）
        """
        text = "默认字幕"
        # 随机选择字体大小
        font_size = self._rng.randint(
            self._range.subtitle_font_size_min,
            self._range.subtitle_font_size_max,
        )
        # 随机选择颜色
        color = self._rng.choice(self._range.subtitle_colors)
        # 随机选择坐标位置
        x_pos = self._rng.choice(self._range.subtitle_x_options)
        y_pos = self._rng.choice(self._range.subtitle_y_options)

        # 记录实际应用的字幕参数
        self._applied.subtitle_text = text
        self._applied.subtitle_font_size = font_size
        self._applied.subtitle_color = color
        self._applied.subtitle_x = x_pos
        self._applied.subtitle_y = y_pos

        # 添加 drawtext 字幕过滤器
        filters.append(
            "drawtext=text='%s':fontsize=%d:fontcolor=%s:x=%s:y=%s"
            % (text, font_size, color, x_pos, y_pos),
        )

    def _build_danmaku(self, filters: list[str]) -> None:
        """
        构建弹幕过滤器

        根据视频时长和随机密度生成多条弹幕，每条弹幕具有不同的出现时间和垂直位置。

        参数:
            filters: 过滤器列表（输出参数）
        """
        # 随机选择弹幕速度和密度
        speed = self._rng.randint(
            self._range.danmaku_speed_min,
            self._range.danmaku_speed_max,
        )
        density = self._rng.randint(
            self._range.danmaku_density_min,
            self._range.danmaku_density_max,
        )
        # 根据视频时长和密度计算弹幕总数
        total_count = int(self._duration / 60.0 * density)
        if total_count < 1:
            total_count = 1

        # 随机选择字体大小和颜色
        font_size = self._rng.randint(
            self._range.danmaku_font_size_min,
            self._range.danmaku_font_size_max,
        )
        color = self._rng.choice(self._range.danmaku_colors)

        # 逐条生成弹幕过滤器
        chosen_texts: list[str] = []
        for _ in range(total_count):
            t = str(self._rng.choice(self._range.danmaku_texts))
            chosen_texts.append(t)
            # 随机生成垂直位置百分比
            y_pct = self._rng.uniform(
                self._range.danmaku_y_pct_min,
                self._range.danmaku_y_pct_max,
            )
            # 随机生成出现时间
            start_time = self._rng.uniform(0, self._duration * 0.8)

            # 添加 drawtext 弹幕过滤器，包含水平移动和显示时间段
            filters.append(
                "drawtext=text='%s':fontsize=%d:fontcolor=%s:"
                "x='w-t*%d':y=h*%.2f:enable='between(t,%.1f,%.1f)'"
                % (t, font_size, color, speed, y_pct, start_time, self._duration + 5),
            )

        # 记录实际应用的弹幕参数
        self._applied.danmaku_texts = chosen_texts
        self._applied.danmaku_font_size = font_size
        self._applied.danmaku_color = color
        self._applied.danmaku_speed = speed

    def get_applied_params(self) -> AppliedOverlayParams:
        """
        获取实际应用的叠加参数

        返回:
            AppliedOverlayParams: 包含所有实际应用参数的数据类实例
        """
        return self._applied
