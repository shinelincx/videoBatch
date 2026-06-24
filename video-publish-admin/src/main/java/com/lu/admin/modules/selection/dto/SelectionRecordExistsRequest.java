package com.lu.admin.modules.selection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "查询商品是否已收藏请求参数")
public class SelectionRecordExistsRequest {

    @Schema(description = "商品ID", example = "3768027660844925783")
    private String productId;
}
