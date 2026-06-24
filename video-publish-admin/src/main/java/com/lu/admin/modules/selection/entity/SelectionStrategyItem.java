package com.lu.admin.modules.selection.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("product_selection_strategy_item")
@Schema(description = "选品策略项")
public class SelectionStrategyItem extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 策略项名称
     */
    @Schema(description = "策略项名称")
    private String name;

    /**
     * 策略项内容（可存JSON、规则描述等）
     */
    @Schema(description = "策略项内容，可存JSON或规则描述")
    private String content;

    /**
     * 状态：1启用，0禁用
     */
    @Schema(description = "状态：1启用、0禁用", example = "1")
    private Integer status;

    /**
     * 排序值，数字越小越靠前
     */
    @Schema(description = "排序值，数字越小越靠前", example = "1")
    private Integer seq;

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
