package com.lu.admin.modules.publish.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "发布配置分页查询条件")
public class PublishConfigQueryRequest {

    @Schema(description = "配置名称", example = "默认发布配置")
    private String name;

    @Schema(description = "状态：0禁用、1启用", example = "1")
    private Integer status;
}
