package com.lu.admin.modules.baseconfig.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Schema(description = "百应类目同步明细")
public class BuyinCategoryItemRequest {

    @Schema(description = "外部类目ID", example = "1001")
    @JsonAlias({"id", "categoryId"})
    private Object externalId;

    @Schema(description = "父级外部类目ID", example = "0")
    @JsonAlias({"parentId", "parentCategoryId"})
    private Object parentExternalId;

    @Schema(description = "类目名称", example = "女装")
    private String name;

    @Schema(description = "类目层级：1一级、2二级、3三级", example = "1")
    private Integer level;

    @Schema(description = "排序值，数字越小越靠前", example = "1")
    private Integer seq;

    @Schema(description = "备注", example = "百应同步")
    private String remark;

    @Schema(description = "来源", example = "buyin")
    private String source;

    @Schema(description = "其它同步字段")
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
        putIfNotNull(map, "externalId", externalId);
        putIfNotNull(map, "parentExternalId", parentExternalId);
        putIfNotNull(map, "name", name);
        putIfNotNull(map, "level", level);
        putIfNotNull(map, "seq", seq);
        putIfNotNull(map, "remark", remark);
        putIfNotNull(map, "source", source);
        return map;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
