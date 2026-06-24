package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "角色权限请求参数")
public class SysRolePermRequest {

    @Schema(description = "角色ID", example = "1780000000000000000")
    private String rid;

    @Schema(description = "权限类型：1菜单、2按钮、3接口、4特殊", example = "1")
    private Integer ptype;

    @Schema(description = "权限值", example = "sys:user:list")
    private String pval;
}
