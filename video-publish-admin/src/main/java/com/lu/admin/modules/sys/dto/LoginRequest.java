package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "登录请求参数")
public class LoginRequest {

    @Schema(description = "登录账号", example = "admin")
    private String uname;

    @Schema(description = "登录密码", example = "123456")
    private String pwd;
}
