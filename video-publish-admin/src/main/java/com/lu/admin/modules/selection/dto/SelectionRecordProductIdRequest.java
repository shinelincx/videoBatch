package com.lu.admin.modules.selection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 通过商品ID查询选品记录请求参数。
 */
@Data
@Schema(description = "通过商品ID查询选品记录请求参数")
public class SelectionRecordProductIdRequest {

    /**
     * 商品ID，用于查询选品记录详情。
     */
    @Schema(description = "商品ID，用于查询选品记录详情", example = "3768027660844925783", requiredMode = Schema.RequiredMode.REQUIRED)
    private String productId;
}
