package com.lu.admin.modules.baseconfig.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("product_category")
@Schema(description = "商品类目")
public class ProductCategory extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 类目名称
     */
    @Schema(description = "类目名称", example = "女装")
    private String name;

    /**
     * 父级ID（0表示顶级分类）
     */
    @Schema(description = "父级ID，0表示顶级分类", example = "0")
    private Long parentId;

    /**
     * 排序（数字越小越靠前）
     */
    @Schema(description = "排序，数字越小越靠前", example = "1")
    private Integer seq;

    /**
     * 层级（1级、2级、3级）
     */
    @Schema(description = "层级：1一级、2二级、3三级", example = "1")
    private Integer level;

    /**
     * 状态：1启用 0禁用
     */
    @Schema(description = "状态：1启用、0禁用", example = "1")
    private Integer status;

    /**
     * 类目描述
     */
    @Schema(description = "类目描述")
    private String remark;

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
