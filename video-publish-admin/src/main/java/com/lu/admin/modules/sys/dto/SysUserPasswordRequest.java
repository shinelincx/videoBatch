package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "修改当前用户密码请求参数")
public class SysUserPasswordRequest {

    @Schema(description = "新密码", example = "123456")
    private String pwd;
}
