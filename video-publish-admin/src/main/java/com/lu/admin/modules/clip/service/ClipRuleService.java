package com.lu.admin.modules.clip.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.modules.clip.entity.ClipRule;
import com.lu.admin.modules.clip.mapper.ClipRuleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClipRuleService extends ServiceImpl<ClipRuleMapper, ClipRule> {

    @Autowired
    private ClipRuleItemService clipRuleItemService;

    /**
     * 分页查询规则，并填充规则项名称（按 seq 排序，逗号拼接）
     */
    public Page<ClipRule> pageWithItemNames(Page<ClipRule> page) {
        Page<ClipRule> result = page(page);
        fillItemNames(result.getRecords());
        return result;
    }

    private void fillItemNames(List<ClipRule> rules) {
        if (rules == null || rules.isEmpty()) {
            return;
        }
        List<Long> ruleIds = rules.stream().map(ClipRule::getId).collect(Collectors.toList());
        Map<Long, List<String>> byRule = clipRuleItemService.itemNamesByRuleIds(ruleIds);
        for (ClipRule r : rules) {
            List<String> names = byRule.getOrDefault(r.getId(), Collections.emptyList());
            r.setItemNames(names.isEmpty() ? "" : String.join(",", names));
        }
    }
}
