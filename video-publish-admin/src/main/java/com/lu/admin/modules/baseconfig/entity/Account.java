package com.lu.admin.modules.baseconfig.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("account")
@Schema(description = "基础账号")
public class Account extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 编码
     */
    @Schema(description = "账号编码")
    private String code;

    /**
     * 昵称
     */
    @Schema(description = "账号昵称")
    private String nickname;

    /**
     * 抖音账号
     */
    @Schema(description = "抖音账号")
    private String douyinAccount;

    /**
     * 百应ID
     */
    @Schema(description = "百应ID")
    private String baiyingId;

    /**
     * 商品类目ID
     */
    @Schema(description = "商品类目ID，可选择任意层级类目", example = "101")
    private Long productCategoryId;

    /**
     * 商品类目名称
     */
    @TableField(exist = false)
    @Schema(description = "商品类目名称")
    private String productCategoryName;

    /**
     * 优先级（1-10，数字越小优先级越高）
     */
    @Schema(description = "优先级：1-10，数字越小优先级越高", example = "1")
    private Integer priority;

    /**
     * 代理ID
     */
    @Schema(description = "代理ID", example = "1")
    private Integer proxyId;

    /**
     * 状态：1启用 0禁用
     */
    @Schema(description = "状态：1启用、0禁用", example = "1")
    private Integer status;

    /**
     * 创作中心cookie（历史兼容字段，不再持久化）
     */
    @Schema(description = "创作中心cookie")
    @TableField(exist = false)
    private String creatorCookie;

    /**
     * 最近登录时间
     */
    @Schema(description = "最近登录时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastLoginTime;

    /**
     * 所属用户
     */
    @Schema(description = "所属用户ID")
    private String userId;

    /**
     * 头像URL
     */
    @Schema(description = "头像URL")
    private String avatar;

    /**
     * 旧版头像URL
     */
    @TableField(exist = false)
    @Schema(description = "头像URL兼容字段")
    private String avatarUrl;

    /**
     * 粉丝数量
     */
    @Schema(description = "粉丝数量", example = "1000")
    private Integer fansCount;

    /**
     * 每日最大发布数
     */
    @TableField("daily_max_publish_count")
    @Schema(description = "每日最大发布数", example = "10")
    private Integer dailyMaxPublishCount;

    /**
     * 备注
     */
    @Schema(description = "备注")
    private String remark;

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;

    public String getAvatarUrl() {
        return avatarUrl != null ? avatarUrl : avatar;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
        if (avatar == null || avatar.isEmpty()) {
            avatar = avatarUrl;
        }
    }
}
