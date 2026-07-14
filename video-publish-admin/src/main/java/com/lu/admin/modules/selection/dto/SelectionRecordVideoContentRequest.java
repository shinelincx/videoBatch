package com.lu.admin.modules.selection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 通过商品ID更新选品记录视频内容请求参数。
 */
@Data
@Schema(description = "通过商品ID更新选品记录视频内容请求参数")
public class SelectionRecordVideoContentRequest {

    @Schema(description = "商品ID", example = "3768027660844925783", requiredMode = Schema.RequiredMode.REQUIRED)
    private String productId;

    @Schema(description = "视频标题")
    private String videoTitle;

    @Schema(description = "视频文案")
    private String videoCopy;

    @Schema(description = "视频话题")
    private String videoTopic;
}
