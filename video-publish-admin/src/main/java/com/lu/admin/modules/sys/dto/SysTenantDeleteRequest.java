package com.lu.admin.modules.sys.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.util.ObjectUtils;

@Data
@Schema(description = "删除租户请求参数")
public class SysTenantDeleteRequest {

    @Schema(description = "租户ID", example = "1")
    private Long id;

    @Schema(description = "租户ID兼容字段", example = "1")
    private String tid;

    public Long tenantId() {
        if (id != null) {
            return id;
        }
        if (ObjectUtils.isEmpty(tid)) {
            return null;
        }
        try {
            return Long.valueOf(tid);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
