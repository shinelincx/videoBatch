package com.lu.admin.modules.selection.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SelectionRecordDTO {
    private Long id;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    private String accountNickname;
    private String productId;
    private String productTitle;
    private String productLink;
    private String trailerLink;
    private Long productCategoryId;
    private BigDecimal commission;
    private BigDecimal commissionRate;
    private BigDecimal price;
    private BigDecimal productRating;
    private Integer totalSales;
    private Integer sellerCount;
    private String shopName;
    private String status;
    private String reason;
}
