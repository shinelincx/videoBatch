package com.lu.admin.modules.publish.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Schema(description = "同步发布账号状态请求参数")
public class PublishAccountStatusRequest {

    @Schema(description = "基础账号ID", example = "1")
    private Long accountId;

    @Schema(description = "基础账号ID兼容字段", example = "1")
    @JsonProperty("account_id")
    private Long accountIdAlias;

    @Schema(description = "账号状态", example = "已登录")
    private String status;

    @Schema(description = "当前状态兼容字段", example = "已登录")
    private String currentStatus;

    @Schema(description = "当前状态兼容字段", example = "已登录")
    @JsonProperty("current_status")
    private String currentStatusAlias;

    @Schema(description = "登录状态：未登录、已登录、异常", example = "异常")
    private String loginStatus;

    @Schema(description = "登录状态兼容字段", example = "异常")
    @JsonProperty("login_status")
    private String loginStatusAlias;

    @Schema(description = "登录异常原因")
    private String loginErrorReason;

    @Schema(description = "登录异常原因兼容字段")
    @JsonProperty("login_error_reason")
    private String loginErrorReasonAlias;

    @Schema(description = "异常原因兼容字段")
    private String errorReason;

    @Schema(description = "异常原因兼容字段")
    private String reason;

    @JsonIgnore
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        putIfNotNull(map, "accountId", accountId);
        putIfNotNull(map, "account_id", accountIdAlias);
        putIfNotNull(map, "status", status);
        putIfNotNull(map, "currentStatus", currentStatus);
        putIfNotNull(map, "current_status", currentStatusAlias);
        putIfNotNull(map, "loginStatus", loginStatus);
        putIfNotNull(map, "login_status", loginStatusAlias);
        putIfNotNull(map, "loginErrorReason", loginErrorReason);
        putIfNotNull(map, "login_error_reason", loginErrorReasonAlias);
        putIfNotNull(map, "errorReason", errorReason);
        putIfNotNull(map, "reason", reason);
        return map;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
