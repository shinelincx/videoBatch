package com.lu.admin.modules.editing.entity;

import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@Schema(description = "切片剪辑任务")
public class ClipEditing extends BaseEntity {

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
     * 开始时间(秒)
     */
    @Schema(description = "开始时间，单位秒", example = "0")
    private Integer startTime;

    /**
     * 结束时间(秒)
     */
    @Schema(description = "结束时间，单位秒", example = "60")
    private Integer endTime;

    /**
     * 切片类型 1随机切片、2关键帧切片、3自定义切片
     */
    @Schema(description = "切片类型：1随机切片、2关键帧切片、3自定义切片", example = "1")
    private Integer clipType;

    /**
     * 切片数量
     */
    @Schema(description = "切片数量", example = "10")
    private Integer clipCount;

    /**
     * 任务状态 0待处理、1处理中、2已完成、3失败
     */
    @Schema(description = "任务状态：0待处理、1处理中、2已完成、3失败", example = "0")
    private Integer taskStatus;

    /**
     * 输出路径(JSON数组)
     */
    @Schema(description = "输出路径，JSON数组")
    private String outputPaths;

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
