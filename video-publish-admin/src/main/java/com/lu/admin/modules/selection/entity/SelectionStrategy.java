package com.lu.admin.modules.selection.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("product_selection_strategy")
@Schema(description = "选品策略")
public class SelectionStrategy extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 选品策略名称
     */
    @Schema(description = "选品策略名称", example = "默认选品策略")
    private String name;

    /**
     * 选品平台：百应、禅选
     */
    @Schema(description = "选品平台：百应、禅选", example = "百应")
    private String platform;

    /**
     * 品类
     */
    @Schema(description = "品类，级联类目路径或类目ID")
    private String category;

    /**
     * 佣金金额下限
     */
    @Schema(description = "佣金金额下限")
    private BigDecimal commissionMin;

    /**
     * 佣金金额上限
     */
    @Schema(description = "佣金金额上限")
    private BigDecimal commissionMax;

    /**
     * 佣金率下限（%）
     */
    @Schema(description = "佣金率下限，单位百分比")
    private BigDecimal commissionRateMin;

    /**
     * 佣金率上限（%）
     */
    @Schema(description = "佣金率上限，单位百分比")
    private BigDecimal commissionRateMax;

    /**
     * 商品价格下限
     */
    @Schema(description = "商品价格下限")
    private BigDecimal priceMin;

    /**
     * 商品价格上限
     */
    @Schema(description = "商品价格上限")
    private BigDecimal priceMax;

    /**
     * 出单比下限（%）
     */
    @Schema(description = "出单比下限，单位百分比")
    private BigDecimal orderRatioMin;

    /**
     * 出单比上限（%）
     */
    @Schema(description = "出单比上限，单位百分比")
    private BigDecimal orderRatioMax;

    /**
     * 商品评分下限（1~5）
     */
    @Schema(description = "商品评分下限，1到5")
    private BigDecimal productRatingMin;

    /**
     * 商品评分上限（1~5）
     */
    @Schema(description = "商品评分上限，1到5")
    private BigDecimal productRatingMax;

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
