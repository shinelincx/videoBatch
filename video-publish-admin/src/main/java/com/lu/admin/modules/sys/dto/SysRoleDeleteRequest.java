package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "删除角色请求参数")
public class SysRoleDeleteRequest {

    @Schema(description = "角色ID", example = "1780000000000000000")
    private String rid;
}
