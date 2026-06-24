package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "角色分页查询参数")
public class SysRoleQueryRequest {

    @Schema(description = "当前页码，从1开始", example = "1")
    private Integer current;

    @Schema(description = "每页条数", example = "10")
    private Integer size;

    @Schema(description = "角色名称，支持模糊查询", example = "管理员")
    private String rname;

    public int pageCurrent() {
        return current == null || current == 0 ? 1 : current;
    }

    public int pageSize() {
        return size == null || size == 0 ? 10 : size;
    }
}
