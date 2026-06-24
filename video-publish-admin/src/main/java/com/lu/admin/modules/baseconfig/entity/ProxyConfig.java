package com.lu.admin.modules.baseconfig.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("proxy")
@Schema(description = "代理配置")
public class ProxyConfig extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 代理名称
     */
    @Schema(description = "代理名称")
    private String name;

    /**
     * 备注
     */
    @Schema(description = "备注")
    private String remark;

    /**
     * 代理IP地址
     */
    @Schema(description = "代理IP地址", example = "127.0.0.1")
    private String ip;

    /**
     * 代理端口
     */
    @Schema(description = "代理端口", example = "7890")
    private Integer port;

    /**
     * 代理协议
     */
    @Schema(description = "代理协议", example = "http")
    private String protocol;

    /**
     * 代理用户名（如需认证）
     */
    @Schema(description = "代理用户名，如需认证时填写")
    private String username;

    /**
     * 代理密码（如需认证）
     */
    @Schema(description = "代理密码，如需认证时填写")
    private String password;

    /**
     * 代理状态 1启用 0禁用
     */
    @Schema(description = "代理状态：1启用、0禁用", example = "1")
    private Integer status;

    /**
     * 连接超时时间（秒）
     */
    @Schema(description = "连接超时时间，单位秒", example = "10")
    private Integer timeout;

    /**
     * 最大连接数
     */
    @Schema(description = "最大连接数", example = "10")
    private Integer maxConnections;

    /**
     * 已使用次数
     */
    @Schema(description = "已使用次数", example = "0")
    private Integer usedCount;

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
