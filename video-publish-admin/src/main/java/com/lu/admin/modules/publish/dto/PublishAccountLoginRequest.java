package com.lu.admin.modules.publish.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "发布账号登录请求参数")
public class PublishAccountLoginRequest {

    @Schema(description = "发布账号ID", example = "1")
    private Long publishAccountId;

    @Schema(description = "客户端机器人ID", example = "1")
    private Long robotId;
}
