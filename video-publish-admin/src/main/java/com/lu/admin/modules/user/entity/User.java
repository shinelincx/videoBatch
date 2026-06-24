package com.lu.admin.modules.user.entity;

import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 用户表
 * </p>
 *
 * @author 
 * @since 2024-04-08
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@Schema(description = "用户")
public class User extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 用户类型  1平台用户、3游客
     */
    @Schema(description = "用户类型：1平台用户、3游客", example = "1")
    private Integer type;

    /**
     * 用户昵称
     */
    @Schema(description = "用户昵称")
    private String nickName;

    /**
     * 头像地址
     */
    @Schema(description = "头像地址")
    private String avatar;

    /**
     * 登录账号
     */
    @Schema(description = "登录账号")
    private String account;

    /**
     * 登录密码
     */
    @Schema(description = "登录密码")
    private String password;

    /**
     * 手机号
     */
    @Schema(description = "手机号")
    private String phone;

    /**
     * 手机国家编号
     */
    @Schema(description = "手机国家编号", example = "86")
    private String phonePrefix;

    /**
     * 邮箱
     */
    @Schema(description = "邮箱")
    private String email;

    /**
     * 0停用、1正常、2封禁
     */
    @Schema(description = "状态：0停用、1正常、2封禁", example = "1")
    private Integer status;

    /**
     * 管理员的备注
     */
    @Schema(description = "管理员备注")
    private String adminNote;

    /**
     * 是否在线
     */
    @Schema(description = "是否在线：0离线、1在线", example = "0")
    private Integer online;
}
