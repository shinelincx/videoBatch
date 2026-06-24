package com.lu.admin.modules.publish.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Schema(description = "发布账号保存请求参数；动态字段需与 publish_account 表字段名一致")
public class PublishAccountRequest {

    @Schema(description = "发布账号主键ID，编辑和删除时必填", example = "1")
    private Long id;

    @Schema(description = "基础账号ID", example = "1")
    @JsonProperty("account_id")
    private Long accountId;

    @Schema(description = "来源账号ID兼容字段", example = "1")
    @JsonProperty("source_account_id")
    private Long sourceAccountId;

    @Schema(description = "基础账号ID兼容字段", example = "1")
    @JsonProperty("base_account_id")
    private Long baseAccountId;

    @Schema(description = "发布配置ID", example = "1")
    @JsonProperty("config_id")
    private Long configId;

    @Schema(description = "关联客户端机器人ID", example = "1")
    private Long robotId;
    @JsonIgnore
    private boolean robotIdProvided;

    @Schema(description = "发布配置ID兼容字段", example = "1")
    @JsonProperty("publish_config_id")
    private Long publishConfigId;

    @Schema(description = "发布配置名称", example = "默认发布配置")
    @JsonProperty("config_name")
    private String configName;

    @Schema(description = "发布配置名称兼容字段", example = "默认发布配置")
    @JsonProperty("publish_config_name")
    private String publishConfigName;

    @Schema(description = "发布时间范围开始", example = "09:00:00")
    @JsonProperty("publish_time_range_begin")
    private String publishTimeRangeBegin;

    @Schema(description = "发布时间范围结束", example = "18:00:00")
    @JsonProperty("publish_time_range_end")
    private String publishTimeRangeEnd;

    @Schema(description = "选品是否审核：0否、1是", example = "0")
    @JsonProperty("selection_audit")
    private Integer selectionAudit;

    @Schema(description = "发布条件列表")
    private List<Map<String, Object>> publishConditions;

    @Schema(description = "今日已选品数", example = "0")
    @JsonProperty("today_selection_count")
    private Integer todaySelectionCount;

    @Schema(description = "当前状态", example = "已登录")
    private String status;

    @Schema(description = "其它动态字段")
    private Map<String, Object> extra = new LinkedHashMap<>();

    @JsonAnySetter
    public void putExtra(String key, Object value) {
        extra.put(key, value);
    }

    @JsonAnyGetter
    public Map<String, Object> any() {
        return extra;
    }

    @JsonIgnore
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>(extra);
        putIfNotNull(map, "id", id);
        putIfNotNull(map, "account_id", accountId);
        putIfNotNull(map, "source_account_id", sourceAccountId);
        putIfNotNull(map, "base_account_id", baseAccountId);
        putIfNotNull(map, "config_id", configId);
        if (robotIdProvided) {
            map.put("robot_id", robotId);
        }
        putIfNotNull(map, "publish_config_id", publishConfigId);
        putIfNotNull(map, "config_name", configName);
        putIfNotNull(map, "publish_config_name", publishConfigName);
        putIfNotNull(map, "publish_time_range_begin", publishTimeRangeBegin);
        putIfNotNull(map, "publish_time_range_end", publishTimeRangeEnd);
        putIfNotNull(map, "selection_audit", selectionAudit);
        if (publishConditions != null) {
            map.put("publishConditions", publishConditions);
        }
        putIfNotNull(map, "today_selection_count", todaySelectionCount);
        putIfNotNull(map, "status", status);
        return map;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }

    @JsonProperty("robot_id")
    @JsonAlias("robotId")
    public void setRobotId(Long robotId) {
        this.robotId = robotId;
        this.robotIdProvided = true;
    }
}
