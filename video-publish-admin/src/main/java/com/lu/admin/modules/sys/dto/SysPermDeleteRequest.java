package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "删除权限请求参数")
public class SysPermDeleteRequest {

    @Schema(description = "权限值", example = "sys:user:list")
    private String pval;
}
