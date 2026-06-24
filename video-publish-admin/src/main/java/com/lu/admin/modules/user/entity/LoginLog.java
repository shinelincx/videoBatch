package com.lu.admin.modules.user.entity;

import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 
 * </p>
 *
 * @author 
 * @since 2024-04-10
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@Schema(description = "登录日志")
public class LoginLog extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 用户id
     */
    @Schema(description = "用户ID", example = "1")
    private Integer userId;

    /**
     * 登录ip
     */
    @Schema(description = "登录IP")
    private String loginIp;

    /**
     * 登录ip的所在地
     */
    @Schema(description = "登录IP所在地")
    private String loginIpName;
}
