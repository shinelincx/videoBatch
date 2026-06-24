package com.lu.admin.modules.publish.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "商品发布记录创建请求")
public class PublishRecordCreateRequest {

    @Schema(description = "商品ID", example = "3689890648498241599")
    private String productId;

    @Schema(description = "账号ID", example = "1")
    private Long accountId;
}
