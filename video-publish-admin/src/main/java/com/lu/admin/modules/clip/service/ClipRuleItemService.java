package com.lu.admin.modules.clip.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.modules.clip.entity.ClipRuleItem;
import com.lu.admin.modules.clip.mapper.ClipRuleItemMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;
import java.util.stream.Collectors;

@Service
public class ClipRuleItemService extends ServiceImpl<ClipRuleItemMapper, ClipRuleItem> {

    private static final String ITEM_TABLE = "clip_rule_item";
    private static final String REL_TABLE = "clip_rule_rule_item";
    private static final String OLD_REL_TABLE = "clip_rule_item_rel";
    private static final int RULE_ITEM_ID_MAX_LENGTH = 128;
    private static final int CONTENT_MAX_LENGTH = 100;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile boolean tableShapeReady = false;

    public synchronized void ensureTableShape() {
        if (tableShapeReady) {
            return;
        }
        if (!tableExists(ITEM_TABLE)) {
            return;
        }
        ensureItemCodeColumn();
        ensureRelationTable();
        migrateOldRelationTable();
        migrateRuleIdRelation();
        dropColumnIfExists("rule_id");
        tableShapeReady = true;
    }

    public List<ClipRuleItem> listByRuleId(Long ruleId) {
        ensureTableShape();
        if (ruleId == null || !tableExists(REL_TABLE)) {
            return Collections.emptyList();
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select `rule_item_id`, `content`, `status`, `seq` from `" + REL_TABLE + "` where `rule_id` = ? " +
                        relationDeletedWhere() + " order by `seq` asc, `id` asc",
                ruleId);
        List<String> itemNames = rows.stream()
                .map(row -> trimToNull(stringValue(row.get("rule_item_id"))))
                .filter(name -> name != null)
                .distinct()
                .collect(Collectors.toList());
        if (itemNames.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, ClipRuleItem> itemByName = itemByName(itemNames);
        List<ClipRuleItem> ordered = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String name = trimToNull(stringValue(row.get("rule_item_id")));
            if (name == null) {
                continue;
            }
            ClipRuleItem savedItem = itemByName.get(name);
            ClipRuleItem item = new ClipRuleItem();
            item.setId(savedItem == null ? null : savedItem.getId());
            item.setCode(savedItem == null ? null : savedItem.getCode());
            item.setName(name);
            item.setContent(stringValue(row.get("content")));
            item.setStatus(intValue(row.get("status"), 1));
            item.setSeq(intValue(row.get("seq"), 0));
            ordered.add(item);
        }
        return ordered;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean createItemWithNextSeq(ClipRuleItem item) {
        ensureTableShape();
        if (item == null) {
            return false;
        }
        item.setSeq(nextSeq());
        return save(item);
    }

    @Transactional(rollbackFor = Exception.class)
    public void saveRuleItems(Long ruleId, List<ClipRuleItem> items) {
        ensureTableShape();
        if (ruleId == null) {
            return;
        }
        if (!tableExists(REL_TABLE)) {
            return;
        }
        jdbcTemplate.update("delete from `" + REL_TABLE + "` where `rule_id` = ?", ruleId);
        if (items == null || items.isEmpty()) {
            return;
        }
        int seq = 0;
        Set<String> savedNames = new HashSet<>();
        for (ClipRuleItem item : items) {
            if (item == null) {
                continue;
            }
            ClipRuleItem savedItem = item.getId() == null ? null : getById(item.getId());
            String ruleItemId = limitText(firstText(item.getName(), savedItem == null ? null : savedItem.getName()),
                    RULE_ITEM_ID_MAX_LENGTH);
            if (ruleItemId == null || savedNames.contains(ruleItemId)) {
                continue;
            }
            String content = item.getContent() == null && savedItem != null ? savedItem.getContent() : item.getContent();
            Integer status = item.getStatus() == null && savedItem != null ? savedItem.getStatus() : item.getStatus();
            Integer itemSeq = item.getSeq() == null && savedItem != null ? savedItem.getSeq() : item.getSeq();
            jdbcTemplate.update("insert into `" + REL_TABLE + "` " +
                            "(`rule_id`, `rule_item_id`, `content`, `status`, `seq`, `deleted`) values (?, ?, ?, ?, ?, 0)",
                    ruleId, ruleItemId, limitText(content, CONTENT_MAX_LENGTH),
                    status == null ? 1 : status, itemSeq == null ? seq : itemSeq);
            savedNames.add(ruleItemId);
            seq++;
        }
    }

    public Map<Long, List<String>> itemNamesByRuleIds(List<Long> ruleIds) {
        ensureTableShape();
        Map<Long, List<String>> result = new LinkedHashMap<>();
        if (ruleIds == null || ruleIds.isEmpty() || !tableExists(REL_TABLE)) {
            return result;
        }
        List<Long> ids = ruleIds.stream().filter(id -> id != null).distinct().collect(Collectors.toList());
        if (ids.isEmpty()) {
            return result;
        }
        StringJoiner placeholders = new StringJoiner(", ");
        List<Object> args = new ArrayList<>();
        for (Long id : ids) {
            placeholders.add("?");
            args.add(id);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select r.`rule_id`, r.`rule_item_id` from `" + REL_TABLE + "` r " +
                        "where r.`rule_id` in (" + placeholders + ")" + relationDeletedWhere("r") +
                        " order by r.`rule_id` asc, r.`seq` asc, r.`id` asc",
                args.toArray());
        for (Map<String, Object> row : rows) {
            Long ruleId = longValue(row.get("rule_id"));
            String name = trimToNull(stringValue(row.get("rule_item_id")));
            if (ruleId == null || name == null) {
                continue;
            }
            result.computeIfAbsent(ruleId, key -> new ArrayList<>()).add(name);
        }
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean deleteItemAndRelations(Long id) {
        ensureTableShape();
        if (id == null) {
            return false;
        }
        ClipRuleItem item = getById(id);
        String ruleItemId = item == null ? null : limitText(item.getName(), RULE_ITEM_ID_MAX_LENGTH);
        if (ruleItemId != null && tableExists(REL_TABLE)) {
            jdbcTemplate.update("delete from `" + REL_TABLE + "` where `rule_item_id` = ?", ruleItemId);
        }
        return removeById(id);
    }

    private void ensureItemCodeColumn() {
        if (!tableHasColumn(ITEM_TABLE, "code")) {
            jdbcTemplate.execute("alter table `" + ITEM_TABLE + "` add column `code` varchar(64) not null default '' comment '规则项代码' after `id`");
            jdbcTemplate.execute("alter table `" + ITEM_TABLE + "` alter column `code` drop default");
        }
    }

    private Integer nextSeq() {
        if (!tableExists(ITEM_TABLE)) {
            return 1;
        }
        String deletedWhere = tableHasColumn(ITEM_TABLE, "deleted") ? " where ifnull(`deleted`, 0) = 0" : "";
        Number maxSeq = jdbcTemplate.queryForObject(
                "select ifnull(max(`seq`), 0) from `" + ITEM_TABLE + "`" + deletedWhere,
                Number.class);
        return maxSeq == null ? 1 : maxSeq.intValue() + 1;
    }

    private void ensureRelationTable() {
        jdbcTemplate.execute("create table if not exists `" + REL_TABLE + "` (" +
                "`id` bigint not null auto_increment comment '主键ID', " +
                "`rule_id` bigint not null comment '所属规则ID（关联 clip_rule 表）', " +
                "`rule_item_id` varchar(128) character set utf8mb4 collate utf8mb4_unicode_ci not null comment '规则项名称', " +
                "`content` varchar(100) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '当前规则项内容（关联的时候覆盖规则项的content）', " +
                "`status` tinyint not null default 1 comment '状态：1=启用，0=禁用', " +
                "`seq` int not null default 0 comment '排序（数值越小越靠前）', " +
                "`create_time` datetime null default current_timestamp comment '创建时间', " +
                "`update_time` datetime null default null on update current_timestamp comment '更新时间', " +
                "`deleted` tinyint null default 0 comment '删除标识： 0正常 1删除', " +
                "`tenant_id` bigint null default null comment '租户标识', " +
                "primary key (`id`), " +
                "key `idx_rule_id` (`rule_id` asc)" +
                ") engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci comment='剪辑规则与规则项关联表' row_format=Dynamic");
    }

    private void migrateOldRelationTable() {
        if (!tableExists(OLD_REL_TABLE)) {
            return;
        }
        jdbcTemplate.update("insert into `" + REL_TABLE + "` " +
                "(`rule_id`, `rule_item_id`, `content`, `status`, `seq`, `deleted`) " +
                "select r.`rule_id`, left(i.`name`, " + RULE_ITEM_ID_MAX_LENGTH + "), " +
                "left(i.`content`, " + CONTENT_MAX_LENGTH + "), ifnull(i.`status`, 1), ifnull(r.`seq`, ifnull(i.`seq`, 0)), ifnull(r.`deleted`, 0) " +
                "from `" + OLD_REL_TABLE + "` r " +
                "join `" + ITEM_TABLE + "` i on i.`id` = r.`item_id` " +
                "where i.`name` is not null and trim(i.`name`) <> '' and not exists (" +
                "select 1 from `" + REL_TABLE + "` nr where nr.`rule_id` = r.`rule_id` " +
                "and nr.`rule_item_id` = left(i.`name`, " + RULE_ITEM_ID_MAX_LENGTH + ")" +
                ")");
    }

    private void migrateRuleIdRelation() {
        if (!tableHasColumn(ITEM_TABLE, "rule_id")) {
            return;
        }
        jdbcTemplate.update("insert into `" + REL_TABLE + "` " +
                "(`rule_id`, `rule_item_id`, `content`, `status`, `seq`, `deleted`) " +
                "select i.`rule_id`, left(i.`name`, " + RULE_ITEM_ID_MAX_LENGTH + "), " +
                "left(i.`content`, " + CONTENT_MAX_LENGTH + "), ifnull(i.`status`, 1), ifnull(i.`seq`, 0), ifnull(i.`deleted`, 0) " +
                "from `" + ITEM_TABLE + "` i " +
                "where i.`rule_id` is not null and i.`name` is not null and trim(i.`name`) <> '' and not exists (" +
                "select 1 from `" + REL_TABLE + "` r where r.`rule_id` = i.`rule_id` " +
                "and r.`rule_item_id` = left(i.`name`, " + RULE_ITEM_ID_MAX_LENGTH + ")" +
                ")");
    }

    private String relationDeletedWhere() {
        return relationDeletedWhere("");
    }

    private String relationDeletedWhere(String alias) {
        if (!tableHasColumn(REL_TABLE, "deleted")) {
            return "";
        }
        String prefix = alias == null || alias.trim().isEmpty() ? "" : alias.trim() + ".";
        return " and ifnull(" + prefix + "`deleted`, 0) = 0";
    }

    private void dropColumnIfExists(String columnName) {
        if (tableHasColumn(ITEM_TABLE, columnName)) {
            jdbcTemplate.execute("alter table `" + ITEM_TABLE + "` drop column `" + columnName + "`");
        }
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Integer intValue(Object value, Integer defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.valueOf(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return defaultValue;
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String firstText(String first, String second) {
        String value = trimToNull(first);
        return value == null ? trimToNull(second) : value;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String limitText(String value, int maxLength) {
        String trimmed = trimToNull(value);
        if (trimmed == null || trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength);
    }

    private Map<String, ClipRuleItem> itemByName(List<String> names) {
        if (names == null || names.isEmpty()) {
            return Collections.emptyMap();
        }
        List<ClipRuleItem> items = list(new QueryWrapper<ClipRuleItem>()
                .in("name", names)
                .orderByAsc("seq")
                .orderByAsc("id"));
        Map<String, ClipRuleItem> result = new LinkedHashMap<>();
        for (ClipRuleItem item : items) {
            String name = trimToNull(item.getName());
            if (name != null) {
                result.putIfAbsent(name, item);
            }
        }
        return result;
    }

    private boolean tableExists(String tableName) {
        Number count = jdbcTemplate.queryForObject(
                "select count(1) from information_schema.TABLES where TABLE_SCHEMA = DATABASE() and TABLE_NAME = ?",
                Number.class, tableName);
        return count != null && count.longValue() > 0;
    }

    private boolean tableHasColumn(String tableName, String columnName) {
        Number count = jdbcTemplate.queryForObject(
                "select count(1) from information_schema.COLUMNS where TABLE_SCHEMA = DATABASE() and TABLE_NAME = ? and COLUMN_NAME = ?",
                Number.class, tableName, columnName);
        return count != null && count.longValue() > 0;
    }
}
