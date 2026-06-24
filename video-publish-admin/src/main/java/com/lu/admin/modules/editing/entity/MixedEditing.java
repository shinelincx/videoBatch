package com.lu.admin.modules.editing.entity;

import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@Schema(description = "混剪任务")
public class MixedEditing extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 任务名称
     */
    @Schema(description = "任务名称")
    private String taskName;

    /**
     * 源视频ID列表(JSON数组)
     */
    @Schema(description = "源视频ID列表，JSON数组")
    private String sourceVideoIds;

    /**
     * 源视频路径列表(JSON数组)
     */
    @Schema(description = "源视频路径列表，JSON数组")
    private String sourceVideoPaths;

    /**
     * 混合类型 1拼接混合、2画中画、3分屏
     */
    @Schema(description = "混合类型：1拼接混合、2画中画、3分屏", example = "1")
    private Integer mixedType;

    /**
     * 混合配置(JSON)
     */
    @Schema(description = "混合配置，JSON格式")
    private String mixedConfig;

    /**
     * 输出视频时长(秒)
     */
    @Schema(description = "输出视频时长，单位秒", example = "60")
    private Integer outputDuration;

    /**
     * 输出分辨率 1720p、21080p、34K
     */
    @Schema(description = "输出分辨率")
    private Integer outputResolution;

    /**
     * 任务状态 0待处理、1处理中、2已完成、3失败
     */
    @Schema(description = "任务状态：0待处理、1处理中、2已完成、3失败", example = "0")
    private Integer taskStatus;

    /**
     * 输出视频路径
     */
    @Schema(description = "输出视频路径")
    private String outputVideoPath;

    /**
     * 错误信息
     */
    @Schema(description = "错误信息")
    private String errorMsg;

    /**
     * 备注
     */
    @Schema(description = "备注")
    private String remark;
}
