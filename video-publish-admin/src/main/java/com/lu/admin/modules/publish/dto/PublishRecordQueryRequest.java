package com.lu.admin.modules.publish.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "发布记录分页查询条件")
public class PublishRecordQueryRequest {

    @Schema(description = "发布账号ID", example = "1")
    private Long accountId;

    @Schema(description = "发布状态", example = "发布成功")
    private String status;
}
