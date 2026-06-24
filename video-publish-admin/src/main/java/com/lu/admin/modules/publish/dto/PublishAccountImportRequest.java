package com.lu.admin.modules.publish.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Schema(description = "从基础账号导入发布账号请求参数")
public class PublishAccountImportRequest {

    @Schema(description = "基础账号ID列表")
    private List<Long> accountIds = new ArrayList<>();

    @Schema(description = "单个基础账号ID，兼容旧参数", example = "1")
    private Long accountId;

    @Schema(description = "发布配置ID", example = "1")
    private Long configId;

    @Schema(description = "关联客户端机器人ID", example = "1")
    @JsonProperty("robot_id")
    @JsonAlias("robotId")
    private Long robotId;

    @Schema(description = "发布配置ID兼容字段", example = "1")
    private Long publishConfigId;

    @Schema(description = "发布配置名称", example = "默认发布配置")
    private String configName;

    @Schema(description = "发布配置名称兼容字段", example = "默认发布配置")
    private String publishConfigName;

    @Schema(description = "发布时间范围开始", example = "09:00:00")
    private String publishTimeRangeBegin;

    @Schema(description = "发布时间范围结束", example = "18:00:00")
    private String publishTimeRangeEnd;

    @Schema(description = "选品是否审核：0否、1是", example = "0")
    private Integer selectionAudit;

    @Schema(description = "发布条件列表")
    private List<Map<String, Object>> publishConditions;

    @JsonIgnore
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("accountIds", accountIds);
        putIfNotNull(map, "accountId", accountId);
        putIfNotNull(map, "configId", configId);
        putIfNotNull(map, "robotId", robotId);
        putIfNotNull(map, "robot_id", robotId);
        putIfNotNull(map, "publishConfigId", publishConfigId);
        putIfNotNull(map, "configName", configName);
        putIfNotNull(map, "publishConfigName", publishConfigName);
        putIfNotNull(map, "publishTimeRangeBegin", publishTimeRangeBegin);
        putIfNotNull(map, "publishTimeRangeEnd", publishTimeRangeEnd);
        putIfNotNull(map, "selectionAudit", selectionAudit);
        putIfNotNull(map, "selection_audit", selectionAudit);
        putIfNotNull(map, "publishConditions", publishConditions);
        return map;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
