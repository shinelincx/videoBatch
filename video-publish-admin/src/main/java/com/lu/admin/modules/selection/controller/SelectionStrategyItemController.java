package com.lu.admin.modules.selection.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.selection.entity.SelectionStrategyItem;
import com.lu.admin.modules.selection.service.SelectionStrategyItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/selection/strategy/item")
public class SelectionStrategyItemController {

    @Autowired
    private SelectionStrategyItemService selectionStrategyItemService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<SelectionStrategyItem> queryPage) {
        Page<SelectionStrategyItem> page = queryPage.createPage();
        QueryWrapper<SelectionStrategyItem> wrapper = TenantUtils.filter(new QueryWrapper<SelectionStrategyItem>())
                .orderByAsc("seq")
                .orderByDesc("id");
        return new ObjectRestResponse().data(selectionStrategyItemService.page(page, wrapper));
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        List<SelectionStrategyItem> list = selectionStrategyItemService.list(TenantUtils.filter(new QueryWrapper<SelectionStrategyItem>())
                .orderByAsc("seq")
                .orderByDesc("id"));
        return new ObjectRestResponse().data(list);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody SelectionStrategyItem selectionStrategyItem) {
        if (selectionStrategyItem.getTenantId() == null) {
            selectionStrategyItem.setTenantId(TenantUtils.currentTenantId());
        }
        selectionStrategyItemService.save(selectionStrategyItem);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody SelectionStrategyItem selectionStrategyItem) {
        if (TenantUtils.currentTenantId() != null) {
            selectionStrategyItem.setTenantId(TenantUtils.currentTenantId());
        }
        QueryWrapper<SelectionStrategyItem> wrapper = TenantUtils.filter(new QueryWrapper<SelectionStrategyItem>())
                .eq("id", selectionStrategyItem.getId());
        selectionStrategyItemService.update(selectionStrategyItem, wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody SelectionStrategyItem selectionStrategyItem) {
        QueryWrapper<SelectionStrategyItem> wrapper = TenantUtils.filter(new QueryWrapper<SelectionStrategyItem>())
                .eq("id", selectionStrategyItem.getId());
        selectionStrategyItemService.remove(wrapper);
        return new ObjectRestResponse();
    }
}
