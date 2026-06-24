package com.lu.admin.modules.baseconfig.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.baseconfig.entity.ProductCategory;
import com.lu.admin.modules.baseconfig.mapper.ProductCategoryMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductCategoryService extends ServiceImpl<ProductCategoryMapper, ProductCategory> {

    public int syncBuyinCategories(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return 0;
        }

        List<Map<String, Object>> categories = new ArrayList<>(rows);
        categories.sort(Comparator
                .comparingInt((Map<String, Object> row) -> intValue(row.get("level"), 1))
                .thenComparingInt(row -> intValue(row.get("seq"), 0)));

        Map<String, Long> externalToLocal = new HashMap<>();
        int count = 0;
        for (Map<String, Object> row : categories) {
            String name = stringValue(row.get("name"));
            if (name.isEmpty() || "全部".equals(name)) {
                continue;
            }

            String externalId = stringValue(firstNonEmpty(row.get("externalId"), row.get("id"), row.get("categoryId")));
            String parentExternalId = stringValue(firstNonEmpty(row.get("parentExternalId"), row.get("parentId"), row.get("parentCategoryId")));
            Long parentId = externalToLocal.get(parentExternalId);
            if (parentId == null) {
                parentId = findIdByExternalId(parentExternalId);
            }
            if (parentId == null) {
                parentId = findIdByPath(parentExternalId);
            }
            if (parentId == null) {
                parentId = 0L;
            }

            Integer level = intValue(row.get("level"), parentId == 0L ? 1 : 2);
            Integer seq = intValue(row.get("seq"), count + 1);
            ProductCategory category = findByExternalId(externalId);
            if (category == null) {
                category = findByNameAndParent(name, parentId);
            }
            if (category == null) {
                category = new ProductCategory();
                category.setTenantId(TenantUtils.currentTenantId());
                category.setStatus(1);
            }
            category.setName(name);
            category.setParentId(parentId);
            if (category.getTenantId() == null) {
                category.setTenantId(TenantUtils.currentTenantId());
            }
            category.setLevel(level);
            category.setSeq(seq);
            category.setRemark(categoryRemark(externalId, parentExternalId, stringValue(firstNonEmpty(row.get("remark"), row.get("source")))));

            if (category.getId() == null) {
                save(category);
            } else {
                updateById(category);
            }

            String key = externalId.isEmpty() ? parentExternalId + "/" + name : externalId;
            if (!key.isEmpty() && category.getId() != null) {
                externalToLocal.put(key, category.getId());
                externalToLocal.put(parentExternalId + "/" + name, category.getId());
            }
            count++;
        }
        return count;
    }

    private ProductCategory findByNameAndParent(String name, Long parentId) {
        QueryWrapper<ProductCategory> wrapper = new QueryWrapper<ProductCategory>()
                .eq("name", name)
                .eq("parent_id", parentId)
                .last("limit 1");
        TenantUtils.filter(wrapper);
        return getOne(wrapper);
    }

    private Long findIdByExternalId(String externalId) {
        ProductCategory category = findByExternalId(externalId);
        return category == null ? null : category.getId();
    }

    private ProductCategory findByExternalId(String externalId) {
        if (externalId.isEmpty()) {
            return null;
        }
        QueryWrapper<ProductCategory> wrapper = new QueryWrapper<ProductCategory>()
                .and(query -> query
                        .likeRight("remark", "externalId=" + externalId + ";")
                        .or()
                        .like("remark", ";externalId=" + externalId + ";"))
                .last("limit 1");
        TenantUtils.filter(wrapper);
        return getOne(wrapper);
    }

    private Long findIdByPath(String path) {
        if (path.isEmpty() || !path.contains("/")) {
            return null;
        }
        String[] names = path.split("/");
        Long parentId = 0L;
        ProductCategory category = null;
        for (String name : names) {
            if (name == null || name.trim().isEmpty()) {
                continue;
            }
            category = findByNameAndParent(name.trim(), parentId);
            if (category == null || category.getId() == null) {
                return null;
            }
            parentId = category.getId();
        }
        return category == null ? null : category.getId();
    }

    private String categoryRemark(String externalId, String parentExternalId, String source) {
        StringBuilder remark = new StringBuilder();
        if (!externalId.isEmpty()) {
            remark.append("externalId=").append(externalId).append(";");
        }
        if (!parentExternalId.isEmpty()) {
            remark.append("parentExternalId=").append(parentExternalId).append(";");
        }
        if (!source.isEmpty()) {
            remark.append("source=").append(source).append(";");
        }
        return remark.toString();
    }

    private Object firstNonEmpty(Object... values) {
        for (Object value : values) {
            if (value != null && !String.valueOf(value).trim().isEmpty()) {
                return value;
            }
        }
        return null;
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private int intValue(Object value, int defaultValue) {
        if (value == null || String.valueOf(value).trim().isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException ignored) {
            return defaultValue;
        }
    }
}
