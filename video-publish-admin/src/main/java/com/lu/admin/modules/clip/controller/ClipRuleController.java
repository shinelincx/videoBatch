package com.lu.admin.modules.clip.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.clip.dto.ClipRuleItemsSaveRequest;
import com.lu.admin.modules.clip.entity.ClipRule;
import com.lu.admin.modules.clip.entity.ClipRuleItem;
import com.lu.admin.modules.clip.service.ClipRuleItemService;
import com.lu.admin.modules.clip.service.ClipRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clip_rule")
public class ClipRuleController {

    @Autowired
    private ClipRuleService clipRuleService;

    @Autowired
    private ClipRuleItemService clipRuleItemService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<ClipRule> queryPage) {
        Page<ClipRule> p = queryPage.createPage();
        return new ObjectRestResponse().data(clipRuleService.pageWithItemNames(p));
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody ClipRule clipRule) {
        clipRuleService.save(clipRule);
        return new ObjectRestResponse().data("id", clipRule.getId());
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody ClipRule clipRule) {
        clipRuleService.updateById(clipRule);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody ClipRule clipRule) {
        clipRuleService.removeById(clipRule.getId());
        return new ObjectRestResponse();
    }

    @GetMapping("/{ruleId}/items")
    public ObjectRestResponse getItems(@PathVariable Long ruleId) {
        return new ObjectRestResponse().data(clipRuleItemService.listByRuleId(ruleId));
    }

    @GetMapping("/items/options")
    public ObjectRestResponse itemOptions() {
        clipRuleItemService.ensureTableShape();
        List<ClipRuleItem> rows = clipRuleItemService.list(
                new QueryWrapper<ClipRuleItem>().orderByAsc("seq").orderByAsc("id"));
        Map<String, ClipRuleItem> unique = new LinkedHashMap<>();
        for (ClipRuleItem item : rows) {
            String name = item.getName() == null ? null : item.getName().trim();
            if (name == null || name.isEmpty()) {
                continue;
            }
            item.setName(name);
            unique.putIfAbsent(name, item);
        }
        return new ObjectRestResponse().data(new ArrayList<>(unique.values()));
    }

    @PostMapping("/items/save")
    public ObjectRestResponse saveItems(@RequestBody ClipRuleItemsSaveRequest request) {
        Long ruleId = request == null ? null : request.getRuleId();
        clipRuleItemService.saveRuleItems(ruleId, request == null ? null : request.getItems());
        return new ObjectRestResponse();
    }

    @PostMapping("/execute")
    public ObjectRestResponse execute(@RequestBody ClipRule clipRule) {
        ClipRule rule = clipRuleService.getById(clipRule.getId());
        if (rule == null) {
            return new ObjectRestResponse().code(400).msg("规则不存在");
        }
        return new ObjectRestResponse();
    }
}
