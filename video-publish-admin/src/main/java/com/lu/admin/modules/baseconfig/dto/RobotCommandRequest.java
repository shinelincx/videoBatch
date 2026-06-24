package com.lu.admin.modules.baseconfig.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "机器人指令请求参数")
public class RobotCommandRequest {

    @Schema(description = "机器人ID", example = "1")
    private Long id;

    @Schema(description = "下发给机器人的指令", example = "start")
    private String command;
}
