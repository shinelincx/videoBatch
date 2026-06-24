"""随机化配置模块 - 统一管理视频处理中的随机参数。

提供以下配置类：
  - FrameRandomRangeConfig: 视频效果随机范围（抽帧、裁剪、模糊、抖动）
  - OverlayRandomConfig: 叠加元素随机配置（水印透明度、字幕、弹幕）
  - MediaFormatsConfig: 支持的媒体格式集合
  - RandomizationConfig: 聚合所有随机化配置

所有配置支持 from_dict/to_dict 方法，用于 JSON 序列化。
"""
from dataclasses import dataclass


# ============================================================
# 帧随机范围配置
# ============================================================

@dataclass
class FrameRandomRangeConfig:
    """视频效果随机范围配置。

    定义抽帧、裁剪、模糊、抖动等效果的随机参数范围。

    属性:
        drop_frame_min/max: 抽帧间隔范围（如每 10-20 帧取 1 帧）
        crop_pct_min/max: 裁剪百分比范围（1.0-2.0 表示裁剪 1%-2%）
        blur_strength_min/max: 模糊强度范围
        shake_pct_min/max: 抖动偏移百分比范围
        bright_min/max: 亮度随机范围（-0.2 到 0.2）
        contrast_min/max: 对比度随机范围（0.5 到 1.5）
        saturation_min/max: 饱和度随机范围（0.5 到 1.5）
        color_balance_min/max: 色彩平衡随机范围（-0.2 到 0.2）
        gamma_min/max: 伽马值随机范围（0.5 到 1.5）
        vintage_bw_min/max: 复古黑白强度随机范围（0.5 到 1.5）
    """
    drop_frame_min: int = 10
    drop_frame_max: int = 20
    crop_pct_min: float = 1.0
    crop_pct_max: float = 2.0
    blur_strength_min: float = 1.0
    blur_strength_max: float = 3.0
    shake_pct_min: float = 1.0
    shake_pct_max: float = 3.0
    bright_min: float = -0.2
    bright_max: float = 0.2
    contrast_min: float = 0.5
    contrast_max: float = 1.5
    saturation_min: float = 0.5
    saturation_max: float = 1.5
    color_balance_min: float = -0.2
    color_balance_max: float = 0.2
    gamma_min: float = 0.5
    gamma_max: float = 1.5
    vintage_bw_min: float = 0.5
    vintage_bw_max: float = 1.5

    @staticmethod
    def from_dict(data: dict) -> "FrameRandomRangeConfig":
        """从字典解析配置，使用默认值填充缺失字段。

        参数:
            data: 配置字典
        返回:
            解析后的配置对象
        """
        drop = data.get("drop_frame_range", [5, 20])
        crop = data.get("crop_pct_range", [1.0, 2.0])
        blur = data.get("blur_strength_range", [1.0, 3.0])
        shake = data.get("shake_pct_range", [1.0, 3.0])
        bright = data.get("brightness_range", [-0.2, 0.2])
        contrast = data.get("contrast_range", [0.5, 1.5])
        saturation = data.get("saturation_range", [0.5, 1.5])
        color_balance = data.get("color_balance_range", [-0.2, 0.2])
        gamma = data.get("gamma_range", [0.5, 1.5])
        vintage_bw = data.get("vintage_bw_range", [0.5, 1.5])
        return FrameRandomRangeConfig(
            drop_frame_min=drop[0],
            drop_frame_max=drop[1],
            crop_pct_min=float(crop[0]),
            crop_pct_max=float(crop[1]),
            blur_strength_min=float(blur[0]),
            blur_strength_max=float(blur[1]),
            shake_pct_min=float(shake[0]),
            shake_pct_max=float(shake[1]),
            bright_min=float(bright[0]),
            bright_max=float(bright[1]),
            contrast_min=float(contrast[0]),
            contrast_max=float(contrast[1]),
            saturation_min=float(saturation[0]),
            saturation_max=float(saturation[1]),
            color_balance_min=float(color_balance[0]),
            color_balance_max=float(color_balance[1]),
            gamma_min=float(gamma[0]),
            gamma_max=float(gamma[1]),
            vintage_bw_min=float(vintage_bw[0]),
            vintage_bw_max=float(vintage_bw[1]),
        )

    def to_dict(self) -> dict:
        """将配置序列化为字典。

        返回:
            配置字典，包含所有范围的 [min, max] 数组
        """
        return {
            "drop_frame_range": [self.drop_frame_min, self.drop_frame_max],
            "crop_pct_range": [self.crop_pct_min, self.crop_pct_max],
            "blur_strength_range": [self.blur_strength_min, self.blur_strength_max],
            "shake_pct_range": [self.shake_pct_min, self.shake_pct_max],
            "brightness_range": [self.bright_min, self.bright_max],
            "contrast_range": [self.contrast_min, self.contrast_max],
            "saturation_range": [self.saturation_min, self.saturation_max],
            "color_balance_range": [self.color_balance_min, self.color_balance_max],
            "gamma_range": [self.gamma_min, self.gamma_max],
            "vintage_bw_range": [self.vintage_bw_min, self.vintage_bw_max],
        }


# ============================================================
# 叠加元素随机配置
# ============================================================

@dataclass
class OverlayRandomConfig:
    """叠加元素随机配置。

    定义水印、字幕、弹幕等叠加元素的随机参数。
    未显式设置的字段使用内置默认值（颜色、文案、位置等）。

    属性:
        watermark_transparency_min/max: 水印透明度范围
        subtitle_font_size_min/max: 字幕字体大小范围
        subtitle_colors: 字幕颜色列表
        subtitle_x/y_options: 字幕位置选项列表
        danmaku_texts: 弹幕文案列表
        danmaku_colors: 弹幕颜色列表
        danmaku_speed_min/max: 弹幕速度范围
        danmaku_density_min/max: 弹幕密度范围
        danmaku_font_size_min/max: 弹幕字体大小范围
        danmaku_y_pct_min/max: 弹幕 Y 轴位置百分比范围
    """
    watermark_transparency_min: float = 0.7
    watermark_transparency_max: float = 0.9
    watermark_motion_speed_x_min: float = 0.4
    watermark_motion_speed_x_max: float = 1.2
    watermark_motion_speed_y_min: float = 0.5
    watermark_motion_speed_y_max: float = 1.5
    watermark_motion_amp_x_min: float = 30.0
    watermark_motion_amp_x_max: float = 80.0
    watermark_motion_amp_y_min: float = 20.0
    watermark_motion_amp_y_max: float = 60.0
    subtitle_font_size_min: int = 20
    subtitle_font_size_max: int = 40
    subtitle_colors: list[str] | None = None
    subtitle_x_options: list[str] | None = None
    subtitle_y_options: list[str] | None = None
    danmaku_texts: list[str] | None = None
    danmaku_colors: list[str] | None = None
    danmaku_speed_min: int = 50
    danmaku_speed_max: int = 150
    danmaku_density_min: int = 3
    danmaku_density_max: int = 8
    danmaku_font_size_min: int = 20
    danmaku_font_size_max: int = 36
    danmaku_y_pct_min: float = 0.05
    danmaku_y_pct_max: float = 0.9

    # 内置默认值
    _DEFAULT_SUBTITLE_COLORS = ["white", "yellow", "green", "cyan"]
    _DEFAULT_SUBTITLE_X = ["(w-text_w)/2", "w*0.2", "w*0.6"]
    _DEFAULT_SUBTITLE_Y = ["h*0.9", "h*0.8", "h*0.85"]
    _DEFAULT_DANMAKU_TEXTS = ["666", "来了来了", "牛啊", "太强了", "厉害了"]
    _DEFAULT_DANMAKU_COLORS = ["white", "red", "yellow", "orange"]

    def __post_init__(self):
        """初始化后填充默认列表值。"""
        if self.subtitle_colors is None:
            self.subtitle_colors = list(self._DEFAULT_SUBTITLE_COLORS)
        if self.subtitle_x_options is None:
            self.subtitle_x_options = list(self._DEFAULT_SUBTITLE_X)
        if self.subtitle_y_options is None:
            self.subtitle_y_options = list(self._DEFAULT_SUBTITLE_Y)
        if self.danmaku_texts is None:
            self.danmaku_texts = list(self._DEFAULT_DANMAKU_TEXTS)
        if self.danmaku_colors is None:
            self.danmaku_colors = list(self._DEFAULT_DANMAKU_COLORS)

    @staticmethod
    def from_dict(data: dict) -> "OverlayRandomConfig":
        """从字典解析配置。

        参数:
            data: 配置字典
        返回:
            解析后的配置对象
        """
        wt = data.get("watermark_transparency_range", [0.7, 0.9])
        wmsx = data.get("watermark_motion_speed_x_range", [0.4, 1.2])
        wmsy = data.get("watermark_motion_speed_y_range", [0.5, 1.5])
        wmax = data.get("watermark_motion_amp_x_range", [30.0, 80.0])
        wmay = data.get("watermark_motion_amp_y_range", [20.0, 60.0])
        sfs = data.get("subtitle_font_size_range", [20, 40])
        ds = data.get("danmaku_speed_range", [50, 150])
        dd = data.get("danmaku_density_range", [3, 8])
        dfs = data.get("danmaku_font_size_range", [20, 36])
        dy = data.get("danmaku_y_pct_range", [0.05, 0.9])
        return OverlayRandomConfig(
            watermark_transparency_min=float(wt[0]),
            watermark_transparency_max=float(wt[1]),
            watermark_motion_speed_x_min=float(wmsx[0]),
            watermark_motion_speed_x_max=float(wmsx[1]),
            watermark_motion_speed_y_min=float(wmsy[0]),
            watermark_motion_speed_y_max=float(wmsy[1]),
            watermark_motion_amp_x_min=float(wmax[0]),
            watermark_motion_amp_x_max=float(wmax[1]),
            watermark_motion_amp_y_min=float(wmay[0]),
            watermark_motion_amp_y_max=float(wmay[1]),
            subtitle_font_size_min=sfs[0],
            subtitle_font_size_max=sfs[1],
            subtitle_colors=data.get("subtitle_colors"),
            subtitle_x_options=data.get("subtitle_x_options"),
            subtitle_y_options=data.get("subtitle_y_options"),
            danmaku_texts=data.get("danmaku_texts"),
            danmaku_colors=data.get("danmaku_colors"),
            danmaku_speed_min=ds[0],
            danmaku_speed_max=ds[1],
            danmaku_density_min=dd[0],
            danmaku_density_max=dd[1],
            danmaku_font_size_min=dfs[0],
            danmaku_font_size_max=dfs[1],
            danmaku_y_pct_min=float(dy[0]),
            danmaku_y_pct_max=float(dy[1]),
        )

    def to_dict(self) -> dict:
        """将配置序列化为字典。

        返回:
            配置字典
        """
        return {
            "watermark_transparency_range": [
                self.watermark_transparency_min,
                self.watermark_transparency_max,
            ],
            "watermark_motion_speed_x_range": [
                self.watermark_motion_speed_x_min,
                self.watermark_motion_speed_x_max,
            ],
            "watermark_motion_speed_y_range": [
                self.watermark_motion_speed_y_min,
                self.watermark_motion_speed_y_max,
            ],
            "watermark_motion_amp_x_range": [
                self.watermark_motion_amp_x_min,
                self.watermark_motion_amp_x_max,
            ],
            "watermark_motion_amp_y_range": [
                self.watermark_motion_amp_y_min,
                self.watermark_motion_amp_y_max,
            ],
            "subtitle_font_size_range": [
                self.subtitle_font_size_min,
                self.subtitle_font_size_max,
            ],
            "subtitle_colors": self.subtitle_colors,
            "subtitle_x_options": self.subtitle_x_options,
            "subtitle_y_options": self.subtitle_y_options,
            "danmaku_texts": self.danmaku_texts,
            "danmaku_colors": self.danmaku_colors,
            "danmaku_speed_range": [self.danmaku_speed_min, self.danmaku_speed_max],
            "danmaku_density_range": [
                self.danmaku_density_min,
                self.danmaku_density_max,
            ],
            "danmaku_font_size_range": [
                self.danmaku_font_size_min,
                self.danmaku_font_size_max,
            ],
            "danmaku_y_pct_range": [self.danmaku_y_pct_min, self.danmaku_y_pct_max],
        }


# ============================================================
# 媒体格式配置
# ============================================================

@dataclass
class MediaFormatsConfig:
    """支持的媒体格式集合。

    定义系统可识别的音频和视频文件格式。
    未显式设置时使用内置默认格式集合。

    属性:
        audio_formats: 支持的音频格式集合（如 mp3, wav, aac）
        video_formats: 支持的视频格式集合（如 mp4, mov, avi）
    """
    audio_formats: set[str] | None = None
    video_formats: set[str] | None = None

    _DEFAULT_AUDIO = {"mp3", "wav", "aac", "ogg", "m4a", "flac", "wma"}
    _DEFAULT_VIDEO = {"mp4", "mov", "avi", "mkv", "webm"}

    def __post_init__(self):
        """初始化后填充默认格式集合。"""
        if self.audio_formats is None:
            self.audio_formats = set(self._DEFAULT_AUDIO)
        if self.video_formats is None:
            self.video_formats = set(self._DEFAULT_VIDEO)

    @staticmethod
    def from_dict(data: dict) -> "MediaFormatsConfig":
        """从字典解析配置。

        参数:
            data: 包含 "audio" 和 "video" 键的字典
        返回:
            解析后的配置对象
        """
        audio = data.get("audio")
        video = data.get("video")
        return MediaFormatsConfig(
            audio_formats=set(audio) if audio is not None else None,
            video_formats=set(video) if video is not None else None,
        )

    def to_dict(self) -> dict:
        """将配置序列化为字典。

        返回:
            配置字典，格式集合排序后输出
        """
        return {
            "audio": sorted(self.audio_formats),
            "video": sorted(self.video_formats),
        }


# ============================================================
# 音频随机配置
# ============================================================

@dataclass
class AudioRandomConfig:
    """音频处理随机范围配置。

    定义语速调整和变调处理的随机参数范围。
    pitch 偏移半音数区间 [-5, 5] 覆盖男声(~-3)到童声(~+6)的常见变调范围。

    属性:
        speed_min/max: 语速范围（0.85 ~ 1.15 表示 85%~115% 原速）
        pitch_semitones_min/max: 变调半音数随机范围（负数降调、正数升调）
    """
    speed_min: float = 0.85
    speed_max: float = 1.15
    pitch_semitones_min: float = -2.0
    pitch_semitones_max: float = 2.0

    @staticmethod
    def from_dict(data: dict) -> "AudioRandomConfig":
        """从字典解析配置，使用默认值填充缺失字段。

        参数:
            data: 配置字典
        返回:
            解析后的配置对象
        """
        speed = data.get("speed_range", [0.85, 1.15])
        pitch_range = data.get("pitch_semitones_range")
        if pitch_range is not None:
            pitch_min = float(pitch_range[0])
            pitch_max = float(pitch_range[1])
        else:
            pitch_min = -5.0
            pitch_max = 5.0
        return AudioRandomConfig(
            speed_min=float(speed[0]),
            speed_max=float(speed[1]),
            pitch_semitones_min=pitch_min,
            pitch_semitones_max=pitch_max,
        )

    def to_dict(self) -> dict:
        """将配置序列化为字典。

        返回:
            配置字典，包含 speed_range 和 pitch_semitones_range
        """
        return {
            "speed_range": [self.speed_min, self.speed_max],
            "pitch_semitones_range": [self.pitch_semitones_min, self.pitch_semitones_max],
        }


# ============================================================
# 随机化配置聚合
# ============================================================

@dataclass
class RandomizationConfig:
    """随机化配置聚合类。

    统一管理所有随机化参数：帧效果范围、叠加元素、媒体格式、文案风格。
    未显式设置的子配置使用各自默认值。

    属性:
        frame: 帧随机范围配置
        overlay: 叠加元素随机配置
        media_formats: 媒体格式配置
        copywriting_styles: 文案风格列表
    """
    frame: FrameRandomRangeConfig | None = None
    overlay: OverlayRandomConfig | None = None
    audio: AudioRandomConfig | None = None
    media_formats: MediaFormatsConfig | None = None
    copywriting_styles: list[str] | None = None

    _DEFAULT_COPYWRITING_STYLES = ["幽默", "正式", "亲切", "悬疑"]

    def __post_init__(self):
        """初始化后填充默认子配置。"""
        if self.frame is None:
            self.frame = FrameRandomRangeConfig()
        if self.overlay is None:
            self.overlay = OverlayRandomConfig()
        if self.audio is None:
            self.audio = AudioRandomConfig()
        if self.media_formats is None:
            self.media_formats = MediaFormatsConfig()
        if self.copywriting_styles is None:
            self.copywriting_styles = list(self._DEFAULT_COPYWRITING_STYLES)

    @staticmethod
    def from_dict(data: dict) -> "RandomizationConfig":
        """从字典解析配置。

        参数:
            data: 配置字典
        返回:
            解析后的配置对象
        """
        return RandomizationConfig(
            frame=FrameRandomRangeConfig.from_dict(data.get("frame", {})),
            overlay=OverlayRandomConfig.from_dict(data.get("overlay", {})),
            audio=AudioRandomConfig.from_dict(data.get("audio", {})),
            media_formats=MediaFormatsConfig.from_dict(
                data.get("media_formats", {}),
            ),
            copywriting_styles=data.get("copywriting_styles"),
        )

    def to_dict(self) -> dict:
        """将配置序列化为字典。

        返回:
            配置字典
        """
        return {
            "frame": self.frame.to_dict(),
            "overlay": self.overlay.to_dict(),
            "audio": self.audio.to_dict(),
            "media_formats": self.media_formats.to_dict(),
            "copywriting_styles": self.copywriting_styles,
        }