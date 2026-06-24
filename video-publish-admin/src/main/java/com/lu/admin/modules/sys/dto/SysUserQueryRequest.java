package com.lu.admin.modules.sys.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Schema(description = "用户分页查询参数")
public class SysUserQueryRequest {

    @Schema(description = "当前页码，从1开始", example = "1")
    private Long current;

    @Schema(description = "每页条数", example = "10")
    private Long size;

    @Schema(description = "用户昵称，支持模糊查询", example = "张三")
    private String nick;

    @JsonIgnore
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("current", current);
        map.put("size", size);
        map.put("nick", nick);
        return map;
    }
}
