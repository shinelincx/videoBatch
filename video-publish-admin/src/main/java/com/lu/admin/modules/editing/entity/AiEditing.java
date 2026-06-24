package com.lu.admin.modules.editing.entity;

import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@Schema(description = "AI剪辑任务")
public class AiEditing extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 任务名称
     */
    @Schema(description = "任务名称")
    private String taskName;

    /**
     * 源视频ID
     */
    @Schema(description = "源视频ID", example = "1")
    private Long sourceVideoId;

    /**
     * 源视频路径
     */
    @Schema(description = "源视频路径")
    private String sourceVideoPath;

    /**
     * AI模型类型 1文生视频、2图生视频、3视频续写
     */
    @Schema(description = "AI模型类型：1文生视频、2图生视频、3视频续写", example = "1")
    private Integer modelType;

    /**
     * 提示词
     */
    @Schema(description = "提示词")
    private String prompt;

    /**
     * 时长(秒)
     */
    @Schema(description = "时长，单位秒", example = "10")
    private Integer duration;

    /**
     * 分辨率 1720p、21080p、34K
     */
    @Schema(description = "分辨率")
    private Integer resolution;

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
