package com.lu.admin.modules.selection.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.selection.entity.SelectionStrategy;
import com.lu.admin.modules.selection.service.SelectionStrategyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/selection/strategy")
public class SelectionStrategyController {

    @Autowired
    private SelectionStrategyService selectionStrategyService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<SelectionStrategy> queryPage) {
        Page<SelectionStrategy> page = queryPage.createPage();
        QueryWrapper<SelectionStrategy> wrapper = TenantUtils.filter(new QueryWrapper<SelectionStrategy>())
                .orderByDesc("id");
        return new ObjectRestResponse().data(selectionStrategyService.page(page, wrapper));
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        List<SelectionStrategy> list = selectionStrategyService.list(TenantUtils.filter(new QueryWrapper<SelectionStrategy>())
                .orderByDesc("id"));
        return new ObjectRestResponse().data(list);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody SelectionStrategy selectionStrategy) {
        if (selectionStrategy.getTenantId() == null) {
            selectionStrategy.setTenantId(TenantUtils.currentTenantId());
        }
        selectionStrategyService.save(selectionStrategy);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody SelectionStrategy selectionStrategy) {
        if (TenantUtils.currentTenantId() != null) {
            selectionStrategy.setTenantId(TenantUtils.currentTenantId());
        }
        QueryWrapper<SelectionStrategy> wrapper = TenantUtils.filter(new QueryWrapper<SelectionStrategy>())
                .eq("id", selectionStrategy.getId());
        selectionStrategyService.update(selectionStrategy, wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody SelectionStrategy selectionStrategy) {
        QueryWrapper<SelectionStrategy> wrapper = TenantUtils.filter(new QueryWrapper<SelectionStrategy>())
                .eq("id", selectionStrategy.getId());
        selectionStrategyService.remove(wrapper);
        return new ObjectRestResponse();
    }
}
