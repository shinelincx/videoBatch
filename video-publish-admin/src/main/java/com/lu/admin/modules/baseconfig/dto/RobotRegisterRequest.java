package com.lu.admin.modules.baseconfig.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "机器人注册请求参数")
public class RobotRegisterRequest {

    @Schema(description = "机器名称", example = "DESKTOP-001")
    private String machineName;

    @Schema(description = "MAC地址", example = "00:11:22:33:44:55")
    private String macAddress;
}
