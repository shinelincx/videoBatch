package com.lu.admin.modules.clip.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("clip_config")
@Schema(description = "剪辑配置")
public class ClipConfig extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Schema(description = "配置代码", example = "cfg-img-v2")
    private String code;

    @Schema(description = "配置名称")
    private String name;

    @Schema(description = "配置版本", example = "2")
    private Integer version;

    @Schema(description = "剪辑模式", example = "image-to-video")
    private String clipMode;

    @Schema(description = "图片视频位置", example = "after")
    private String imgVideoPosition;

    @Schema(description = "抽帧")
    private Boolean frameExtraction;

    @Schema(description = "裁剪")
    private Boolean cropping;

    @Schema(description = "模糊")
    private Boolean blur;

    @Schema(description = "抖动")
    private Boolean shake;

    @Schema(description = "水印")
    private Boolean watermark;

    @Schema(description = "亮度")
    private Boolean brightness;

    @Schema(description = "对比度")
    private Boolean contrast;

    @Schema(description = "饱和度")
    private Boolean saturation;

    @Schema(description = "色彩平衡")
    private Boolean colorBalance;

    @Schema(description = "伽马")
    private Boolean gamma;

    @Schema(description = "复古黑白")
    private Boolean vintageBw;

    @Schema(description = "字幕")
    private Boolean subtitles;

    @Schema(description = "弹幕")
    private Boolean danmaku;

    @Schema(description = "贴纸")
    private Boolean sticker;

    @Schema(description = "片头")
    private Boolean prependEnabled;

    @Schema(description = "片尾")
    private Boolean appendEnabled;

    @Schema(description = "背景音乐")
    private Boolean backgroundMusicEnabled;

    @Schema(description = "速度调整")
    private Boolean speedAdjustmentEnabled;

    @Schema(description = "音调调整")
    private Boolean pitchEnabled;

    @Schema(description = "循环次数", example = "1")
    private Integer loopCount;

    @Schema(description = "单张图片默认时长", example = "3.0")
    private BigDecimal defaultDurationPerImage;

    @Schema(description = "状态：1启用、0禁用", example = "1")
    private Integer status;

    @Schema(description = "备注")
    private String remark;

    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
