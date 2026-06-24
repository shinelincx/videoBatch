package com.lu.admin.modules.baseconfig.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.baseconfig.dto.BuyinCategoryItemRequest;
import com.lu.admin.modules.baseconfig.dto.BuyinCategorySyncRequest;
import com.lu.admin.modules.baseconfig.entity.ProductCategory;
import com.lu.admin.modules.baseconfig.service.ProductCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/base/category")
public class ProductCategoryController {

    @Autowired
    private ProductCategoryService productCategoryService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<ProductCategory> queryPage) {
        Page<ProductCategory> page = queryPage.createPage();
        QueryWrapper<ProductCategory> wrapper = TenantUtils.filter(new QueryWrapper<ProductCategory>())
                .orderByAsc("level")
                .orderByAsc("seq")
                .orderByAsc("id");
        return new ObjectRestResponse().data(productCategoryService.page(page, wrapper));
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        List<ProductCategory> list = productCategoryService.list(TenantUtils.filter(new QueryWrapper<ProductCategory>())
                .orderByAsc("level")
                .orderByAsc("seq")
                .orderByAsc("id"));
        return new ObjectRestResponse().data(list);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody ProductCategory productCategory) {
        if (productCategory.getTenantId() == null) {
            productCategory.setTenantId(TenantUtils.currentTenantId());
        }
        productCategoryService.save(productCategory);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody ProductCategory productCategory) {
        if (TenantUtils.currentTenantId() != null) {
            productCategory.setTenantId(TenantUtils.currentTenantId());
        }
        QueryWrapper<ProductCategory> wrapper = TenantUtils.filter(new QueryWrapper<ProductCategory>())
                .eq("id", productCategory.getId());
        productCategoryService.update(productCategory, wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody ProductCategory productCategory) {
        QueryWrapper<ProductCategory> wrapper = TenantUtils.filter(new QueryWrapper<ProductCategory>())
                .eq("id", productCategory.getId());
        productCategoryService.remove(wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/sync/buyin")
    public ObjectRestResponse syncBuyin(@RequestBody BuyinCategorySyncRequest request) {
        List<Map<String, Object>> categories = new ArrayList<>();
        if (request != null && request.getCategories() != null) {
            for (BuyinCategoryItemRequest item : request.getCategories()) {
                if (item != null) {
                    categories.add(item.toMap());
                }
            }
        }
        return new ObjectRestResponse().data("count", productCategoryService.syncBuyinCategories(categories));
    }
}
