package com.lu.admin.modules.publish.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "发布账号启动发布请求参数")
public class PublishAccountStartPublishRequest {

    @Schema(description = "发布账号ID列表")
    private List<Long> publishAccountIds;

    @Schema(description = "客户端机器人ID", example = "1")
    private Long robotId;
}
