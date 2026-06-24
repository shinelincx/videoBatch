package com.lu.admin.modules.publish.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("publish_config")
@Schema(description = "发布配置")
public class PublishConfig extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Schema(description = "配置名称")
    private String name;

    @Schema(description = "是否达人带货", example = "1")
    private Integer isCarrier;

    @Schema(description = "发布延迟，单位小时", example = "30")
    private Integer publishDelay;

    @Schema(description = "发布间隔频率(分钟)", example = "30")
    private Integer publishInterval;

    @Schema(description = "发布目录")
    private String publishDir;

    @Schema(description = "关联剪辑配置ID", example = "1")
    private Long clipConfigId;

    @Schema(description = "自主声明")
    private String selfDeclaration;

    @Schema(description = "同时发布")
    private String syncPublish;

    @Schema(description = "谁可以看")
    private String visibility;

    @Schema(description = "保存权限")
    private String savePermission;

    @Schema(description = "发布时间")
    private String publishTime;

    @Schema(description = "选品是否审核：0否、1是", example = "0")
    private Integer selectionAudit;

    @Schema(description = "选品策略ID", example = "1")
    private Long selectionStrategyId;

    @Schema(description = "状态：1启用、0禁用", example = "1")
    private Integer status;

    @Schema(description = "备注")
    private String remark;

    @Schema(description = "所属用户ID")
    private String userId;

    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
