package com.lu.admin.modules.baseconfig.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "基础账号登录请求参数")
public class AccountLoginRequest {

    @Schema(description = "基础账号ID", example = "1")
    private Long accountId;

    @Schema(description = "客户端机器人ID", example = "1")
    private Long robotId;
}
