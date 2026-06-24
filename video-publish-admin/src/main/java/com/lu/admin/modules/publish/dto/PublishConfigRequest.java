package com.lu.admin.modules.publish.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Schema(description = "发布配置保存请求参数；动态字段需与 publish_config 表字段名一致")
public class PublishConfigRequest {

    @Schema(description = "发布配置ID，编辑和删除时必填", example = "1")
    private Long id;

    @Schema(description = "配置名称", example = "默认发布配置")
    private String name;

    @Schema(description = "是否达人带货", example = "1")
    @JsonProperty("is_carrier")
    @JsonAlias("isCarrier")
    private Integer isCarrier;

    @Schema(description = "发布延迟，单位小时", example = "30")
    @JsonProperty("publish_delay")
    @JsonAlias("publishDelay")
    private Integer publishDelay;

    @Schema(description = "发布间隔频率(分钟)", example = "30")
    @JsonProperty("publish_interval")
    @JsonAlias("publishInterval")
    private Integer publishInterval;

    @Schema(description = "发布目录", example = "D:/test/output")
    @JsonProperty("publish_dir")
    @JsonAlias("publishDir")
    private String publishDir;

    @Schema(description = "关联剪辑配置ID", example = "1")
    private Long clipConfigId;

    @JsonIgnore
    private boolean clipConfigIdPresent;

    @Schema(description = "自主声明", example = "无需添加自主声明")
    @JsonProperty("self_declaration")
    @JsonAlias("selfDeclaration")
    private String selfDeclaration;

    @Schema(description = "同时发布", example = "不同时发布")
    @JsonProperty("sync_publish")
    @JsonAlias("syncPublish")
    private String syncPublish;

    @Schema(description = "谁可以看", example = "公开")
    private String visibility;

    @Schema(description = "保存权限", example = "允许")
    @JsonProperty("save_permission")
    @JsonAlias("savePermission")
    private String savePermission;

    @Schema(description = "发布时间", example = "立即发布")
    @JsonProperty("publish_time")
    @JsonAlias("publishTime")
    private String publishTime;

    @Schema(description = "选品是否审核：0否、1是", example = "0")
    @JsonProperty("selection_audit")
    @JsonAlias("selectionAudit")
    private Integer selectionAudit;

    @Schema(description = "选品策略ID", example = "1")
    @JsonProperty("selection_strategy_id")
    @JsonAlias("selectionStrategyId")
    private Long selectionStrategyId;

    @Schema(description = "状态：0禁用、1启用", example = "1")
    private Integer status;

    @Schema(description = "备注")
    private String remark;

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
        putIfNotNull(map, "name", name);
        putIfNotNull(map, "is_carrier", isCarrier);
        putIfNotNull(map, "publish_delay", publishDelay);
        putIfNotNull(map, "publish_interval", publishInterval);
        putIfNotNull(map, "publish_dir", publishDir);
        if (clipConfigIdPresent) {
            map.put("clip_config_id", clipConfigId);
        }
        putIfNotNull(map, "self_declaration", selfDeclaration);
        putIfNotNull(map, "sync_publish", syncPublish);
        putIfNotNull(map, "visibility", visibility);
        putIfNotNull(map, "save_permission", savePermission);
        putIfNotNull(map, "publish_time", publishTime);
        putIfNotNull(map, "selection_audit", selectionAudit);
        putIfNotNull(map, "selection_strategy_id", selectionStrategyId);
        putIfNotNull(map, "status", status);
        putIfNotNull(map, "remark", remark);
        return map;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }

    @JsonProperty("clip_config_id")
    @JsonAlias("clipConfigId")
    public void setClipConfigId(Long clipConfigId) {
        this.clipConfigId = clipConfigId;
        this.clipConfigIdPresent = true;
    }
}
