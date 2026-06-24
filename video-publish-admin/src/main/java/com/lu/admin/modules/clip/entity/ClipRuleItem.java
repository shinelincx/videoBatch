package com.lu.admin.modules.clip.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("clip_rule_item")
@Schema(description = "剪辑规则明细项")
public class ClipRuleItem extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 规则项代码
     */
    @Schema(description = "规则项代码")
    private String code;

    /**
     * 规则项名称
     */
    @Schema(description = "规则项名称")
    private String name;

    /**
     * 规则项内容（具体配置参数）
     */
    @Schema(description = "规则项内容，具体配置参数")
    private String content;

    /**
     * 状态 1启用、0禁用
     */
    @Schema(description = "状态：1启用、0禁用", example = "1")
    private Integer status;

    /**
     * 排序（数值越小越靠前）
     */
    @Schema(description = "排序，数值越小越靠前", example = "1")
    private Integer seq;
}
