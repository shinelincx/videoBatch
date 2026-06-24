package com.lu.admin.modules.clip.dto;

import com.lu.admin.modules.clip.entity.ClipRuleItem;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "保存剪辑规则明细项请求参数")
public class ClipRuleItemsSaveRequest {

    @Schema(description = "剪辑规则ID", example = "1")
    private Long ruleId;

    @Schema(description = "剪辑规则明细项列表")
    private List<ClipRuleItem> items = new ArrayList<>();
}
