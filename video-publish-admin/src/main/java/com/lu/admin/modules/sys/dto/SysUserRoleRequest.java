package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "更新用户角色请求参数")
public class SysUserRoleRequest {

    @Schema(description = "用户ID", example = "1780000000000000000")
    private String uid;

    @Schema(description = "角色ID列表")
    private List<String> rids = new ArrayList<>();
}
