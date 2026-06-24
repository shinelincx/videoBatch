package com.lu.admin.modules.publish.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Schema(description = "发布账号任务请求参数")
public class PublishAccountTaskRequest {

    @Schema(description = "发布账号ID，启动选品时可直接传 id", example = "1")
    private Long id;

    @Schema(description = "发布账号ID", example = "1")
    private Long publishAccountId;

    @Schema(description = "发布账号ID兼容字段", example = "1")
    @JsonProperty("publish_account_id")
    private Long publishAccountIdAlias;

    @Schema(description = "基础账号ID，采集或停止采集品类时必填", example = "1")
    private Long accountId;

    @Schema(description = "基础账号ID兼容字段", example = "1")
    @JsonProperty("account_id")
    private Long accountIdAlias;

    @JsonIgnore
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        putIfNotNull(map, "id", id);
        putIfNotNull(map, "publishAccountId", publishAccountId);
        putIfNotNull(map, "publish_account_id", publishAccountIdAlias);
        putIfNotNull(map, "accountId", accountId);
        putIfNotNull(map, "account_id", accountIdAlias);
        return map;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
