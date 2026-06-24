package com.lu.admin.modules.baseconfig.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "同步百应商品类目请求参数")
public class BuyinCategorySyncRequest {

    @Schema(description = "待同步的百应类目列表")
    private List<BuyinCategoryItemRequest> categories = new ArrayList<>();
}
