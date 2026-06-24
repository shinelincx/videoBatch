package com.lu.admin.modules.baseconfig.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("robot")
@Schema(description = "客户端机器人")
public class Robot extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 机器名称
     */
    @Schema(description = "机器名称")
    private String machineName;

    /**
     * MAC地址
     */
    @Schema(description = "MAC地址")
    private String macAddress;

    /**
     * 当前状态：离线、待机、运行中、暂停中
     */
    @Schema(description = "当前状态：离线、待机、运行中、暂停中", example = "待机")
    private String status;

    /**
     * 当前待执行命令：start、resume、pause、stop
     */
    @Schema(description = "当前待执行命令：start、resume、pause、stop", example = "start")
    private String currentCommand;

    /**
     * 最近执行命令
     */
    @Schema(description = "最近执行命令")
    private String lastCommand;

    /**
     * 最后心跳时间
     */
    @Schema(description = "最后心跳时间")
    private LocalDateTime lastHeartbeatTime;

    /**
     * 命令下发时间
     */
    @Schema(description = "命令下发时间")
    private LocalDateTime commandTime;

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;

    /**
     * 所属租户名称
     */
    @TableField(exist = false)
    @Schema(description = "所属租户名称")
    private String tenantName;
}
