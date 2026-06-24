package com.lu.admin.modules.selection.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 通过商品ID修改选品记录状态请求参数。
 */
@Data
@Schema(description = "通过商品ID修改选品记录状态请求参数")
public class SelectionRecordStatusUpdateRequest {

    /**
     * 商品ID，用于定位需要修改状态的选品记录。
     */
    @Schema(description = "商品ID，用于定位需要修改状态的选品记录", example = "3768027660844925783", requiredMode = Schema.RequiredMode.REQUIRED)
    private String productId;

    /**
     * 账号ID，用于发布成功时累加发布账号今日发布数。
     */
    @Schema(description = "账号ID，状态为发布成功时用于累加发布账号今日发布数", example = "4")
    @JsonProperty("account_id")
    @JsonAlias("accountId")
    private Long accountId;

    /**
     * 目标状态。
     */
    @Schema(description = "目标状态：已作废、待配置、待剪辑、剪辑中、剪辑失败、待发布、发布中、发布失败、发布成功", example = "剪辑中", requiredMode = Schema.RequiredMode.REQUIRED)
    private String status;

    @Schema(description = "原因")
    private String reason;
}
