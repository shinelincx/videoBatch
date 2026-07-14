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
@TableName("product_selection_records")
@Schema(description = "选品记录")
public class SelectionRecord extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 选品账号ID
     */
    @Schema(description = "选品账号ID", example = "1")
    private Long accountId;

    /**
     * 账号昵称
     */
    @Schema(description = "账号昵称")
    private String accountNickname;

    /**
     * 商品ID
     */
    @Schema(description = "商品ID")
    private String productId;

    /**
     * 商品标题
     */
    @Schema(description = "商品标题")
    private String productTitle;

    /**
     * 商品链接
     */
    @Schema(description = "商品链接")
    private String productLink;

    /**
     * 挂车链接
     */
    @Schema(description = "挂车链接")
    private String trailerLink;

    /**
     * 商品类目ID
     */
    @Schema(description = "商品类目ID", example = "1")
    private Long productCategoryId;

    /**
     * 佣金（单位：元）
     */
    @Schema(description = "佣金，单位元")
    private BigDecimal commission;

    /**
     * 佣金率（单位：%）
     */
    @Schema(description = "佣金率，单位百分比")
    private BigDecimal commissionRate;

    /**
     * 价格（单位：元）
     */
    @Schema(description = "价格，单位元")
    private BigDecimal price;

    /**
     * 商品评分（0-5分）
     */
    @Schema(description = "商品评分，0到5分")
    private BigDecimal productRating;

    /**
     * 总销量
     */
    @Schema(description = "总销量")
    private Integer totalSales;

    /**
     * 带货人数
     */
    @Schema(description = "带货人数")
    private Integer sellerCount;

    /**
     * 商铺名称
     */
    @Schema(description = "商铺名称")
    private String shopName;

    /**
     * 视频标题
     */
    @Schema(description = "视频标题")
    private String videoTitle;

    /**
     * 视频文案
     */
    @Schema(description = "视频文案")
    private String videoCopy;

    /**
     * 视频话题
     */
    @Schema(description = "视频话题")
    private String videoTopic;

    /**
     * 状态
     */
    @Schema(description = "状态")
    private String status;

    /**
     * 原因
     */
    @Schema(description = "原因")
    private String reason;

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;
}
