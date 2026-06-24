package com.lu.admin.modules.clip.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.clip.entity.ClipRuleItem;
import com.lu.admin.modules.clip.service.ClipRuleItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/clip_rule_item")
public class ClipRuleItemController {

    @Autowired
    private ClipRuleItemService clipRuleItemService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<ClipRuleItem> queryPage) {
        clipRuleItemService.ensureTableShape();
        Page<ClipRuleItem> page = queryPage.createPage();
        QueryWrapper<ClipRuleItem> wrapper = buildQueryWrapper(queryPage.getParams());
        return new ObjectRestResponse().data(clipRuleItemService.page(page, wrapper));
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        clipRuleItemService.ensureTableShape();
        List<ClipRuleItem> list = clipRuleItemService.list(
                new QueryWrapper<ClipRuleItem>().orderByAsc("seq").orderByDesc("id"));
        return new ObjectRestResponse().data(list);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody ClipRuleItem clipRuleItem) {
        clipRuleItemService.ensureTableShape();
        ObjectRestResponse invalidResponse = validateAndNormalize(clipRuleItem, false);
        if (invalidResponse != null) {
            return invalidResponse;
        }
        if (clipRuleItem.getStatus() == null) {
            clipRuleItem.setStatus(1);
        }
        clipRuleItemService.createItemWithNextSeq(clipRuleItem);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody ClipRuleItem clipRuleItem) {
        clipRuleItemService.ensureTableShape();
        ObjectRestResponse invalidResponse = validateAndNormalize(clipRuleItem, true);
        if (invalidResponse != null) {
            return invalidResponse;
        }
        clipRuleItemService.updateById(clipRuleItem);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody ClipRuleItem clipRuleItem) {
        Long id = clipRuleItem == null ? null : clipRuleItem.getId();
        if (id == null) {
            return new ObjectRestResponse().code(400).msg("规则项ID不能为空");
        }
        clipRuleItemService.deleteItemAndRelations(id);
        return new ObjectRestResponse();
    }

    private QueryWrapper<ClipRuleItem> buildQueryWrapper(ClipRuleItem params) {
        QueryWrapper<ClipRuleItem> wrapper = new QueryWrapper<>();
        if (params != null) {
            if (hasText(params.getCode())) {
                wrapper.like("code", params.getCode().trim());
            }
            if (hasText(params.getName())) {
                wrapper.like("name", params.getName().trim());
            }
            if (params.getStatus() != null) {
                wrapper.eq("status", params.getStatus());
            }
        }
        return wrapper.orderByAsc("seq").orderByDesc("id");
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private ObjectRestResponse validateAndNormalize(ClipRuleItem clipRuleItem, boolean update) {
        if (clipRuleItem == null) {
            return new ObjectRestResponse().code(400).msg("规则项不能为空");
        }
        if (update && clipRuleItem.getId() == null) {
            return new ObjectRestResponse().code(400).msg("规则项ID不能为空");
        }
        if (!hasText(clipRuleItem.getCode())) {
            return new ObjectRestResponse().code(400).msg("规则项代码不能为空");
        }
        if (!hasText(clipRuleItem.getName())) {
            return new ObjectRestResponse().code(400).msg("规则项名称不能为空");
        }
        clipRuleItem.setCode(clipRuleItem.getCode().trim());
        clipRuleItem.setName(clipRuleItem.getName().trim());
        return null;
    }
}
