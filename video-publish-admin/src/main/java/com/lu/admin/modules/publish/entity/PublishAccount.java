package com.lu.admin.modules.publish.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("publish_account")
@Schema(description = "发布账号")
public class PublishAccount extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Schema(description = "基础账号ID", example = "1")
    private Long accountId;

    @Schema(description = "发布配置ID", example = "1")
    private Long configId;

    @Schema(description = "关联客户端机器人ID", example = "1")
    private Long robotId;

    @Schema(description = "所属用户ID")
    private String userId;

    @Schema(description = "发布时间范围开始", example = "09:00:00")
    @JsonFormat(pattern = "HH:mm:ss")
    @TableField(exist = false)
    private LocalTime publishTimeRangeBegin;

    @Schema(description = "发布时间范围结束", example = "18:00:00")
    @JsonFormat(pattern = "HH:mm:ss")
    @TableField(exist = false)
    private LocalTime publishTimeRangeEnd;

    @Schema(description = "商品类目名称")
    private String productCategoryName;

    @Schema(description = "配置名称")
    private String configName;

    @Schema(description = "百应ID")
    private String baiyingId;

    @Schema(description = "粉丝数量", example = "1000")
    private Integer fansCount;

    @Schema(description = "今日选品数", example = "0")
    private Integer todaySelectionCount;

    @Schema(description = "今日发布数", example = "0")
    @TableField(exist = false)
    private Integer todayPublishCount;

    @Schema(description = "当前状态")
    private String status;

    @Schema(description = "登录状态：未登录、已登录、异常")
    private String loginStatus;

    @Schema(description = "登录异常原因")
    private String loginErrorReason;

    @Schema(description = "备注")
    private String remark;

    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
