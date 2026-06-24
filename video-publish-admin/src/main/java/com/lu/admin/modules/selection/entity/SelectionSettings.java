package com.lu.admin.modules.selection.entity;

import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@Schema(description = "选品设置")
public class SelectionSettings extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 设置名称
     */
    @Schema(description = "设置名称")
    private String name;

    /**
     * 设置类型 1选品规则、2筛选条件
     */
    @Schema(description = "设置类型：1选品规则、2筛选条件", example = "1")
    private Integer type;

    /**
     * 设置内容(JSON)
     */
    @Schema(description = "设置内容，JSON格式")
    private String content;

    /**
     * 状态 0禁用、1启用
     */
    @Schema(description = "状态：0禁用、1启用", example = "1")
    private Integer status;

    /**
     * 排序
     */
    @Schema(description = "排序", example = "1")
    private Integer sort;

    /**
     * 备注
     */
    @Schema(description = "备注")
    private String remark;
}
