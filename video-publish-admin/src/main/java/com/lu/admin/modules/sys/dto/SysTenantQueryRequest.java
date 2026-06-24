package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.util.ObjectUtils;

@Data
@Schema(description = "租户分页查询参数")
public class SysTenantQueryRequest {

    @Schema(description = "当前页码，从1开始", example = "1")
    private Integer current;

    @Schema(description = "每页条数", example = "10")
    private Integer size;

    @Schema(description = "租户名称", example = "默认租户")
    private String name;

    @Schema(description = "租户名称兼容字段", example = "默认租户")
    private String tname;

    public String queryName() {
        return ObjectUtils.isEmpty(name) ? tname : name;
    }

    public int pageCurrent() {
        return current == null || current == 0 ? 1 : current;
    }

    public int pageSize() {
        return size == null || size == 0 ? 10 : size;
    }
}
