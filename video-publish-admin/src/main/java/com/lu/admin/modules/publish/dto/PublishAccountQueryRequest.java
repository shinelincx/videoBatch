package com.lu.admin.modules.publish.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "发布账号分页查询条件")
public class PublishAccountQueryRequest {

    @Schema(description = "基础账号ID", example = "1")
    private Long accountId;

    @Schema(description = "发布配置ID", example = "1")
    private Long configId;

    @Schema(description = "当前状态", example = "已登录")
    private String status;
}
