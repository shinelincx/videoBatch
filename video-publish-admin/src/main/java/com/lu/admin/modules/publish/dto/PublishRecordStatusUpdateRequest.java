package com.lu.admin.modules.publish.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "商品发布记录状态更新请求")
public class PublishRecordStatusUpdateRequest {

    @Schema(description = "发布记录ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long id;

    @Schema(description = "发布状态：待发布、发布中、发布失败、发布成功", example = "发布成功", requiredMode = Schema.RequiredMode.REQUIRED)
    private String status;

    @Schema(description = "原因")
    private String reason;
}
