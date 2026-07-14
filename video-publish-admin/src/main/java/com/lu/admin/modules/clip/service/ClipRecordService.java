package com.lu.admin.modules.clip.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.clip.entity.ClipRecord;
import com.lu.admin.modules.clip.mapper.ClipRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.stream.Collectors;

@Service
public class ClipRecordService extends ServiceImpl<ClipRecordMapper, ClipRecord> {

    private static final String STATUS_PENDING_CLIP = "待剪辑";
    private static final List<String> CLIPPED_STATUSES = Arrays.asList("待发布", "发布中", "发布失败", "发布成功");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile boolean clipRecordColumnsReady = false;

    public synchronized void ensureTableShape() {
        if (clipRecordColumnsReady) {
            return;
        }
        if (!tableExists("clip_record")) {
            return;
        }
        dropColumnIfExists("clip_score");
        dropColumnIfExists("status");
        dropColumnIfExists("account_id");
        dropColumnIfExists("product_title");
        dropColumnIfExists("rule_id");
        clipRecordColumnsReady = true;
    }

    public boolean createPendingClipRecordIfAbsent(String productId) {
        ensureTableShape();
        if (!hasText(productId) || !tableExists("clip_record") || !tableHasColumn("clip_record", "product_id")) {
            return false;
        }

        String normalizedProductId = productId.trim();
        Long tenantId = TenantUtils.currentTenantId();
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("`product_id` = ?");
        args.add(normalizedProductId);
        if (tableHasColumn("clip_record", "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        if (tenantId != null && tableHasColumn("clip_record", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }

        Number count = jdbcTemplate.queryForObject(
                "select count(1) from `clip_record` where " + String.join(" and ", clauses),
                args.toArray(),
                Number.class);
        if (count != null && count.longValue() > 0) {
            return false;
        }

        List<String> columns = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        columns.add("product_id");
        values.add(normalizedProductId);
        LocalDateTime now = LocalDateTime.now();
        if (tableHasColumn("clip_record", "create_time")) {
            columns.add("create_time");
            values.add(now);
        }
        if (tableHasColumn("clip_record", "update_time")) {
            columns.add("update_time");
            values.add(now);
        }
        if (tableHasColumn("clip_record", "deleted")) {
            columns.add("deleted");
            values.add(0);
        }
        if (tenantId != null && tableHasColumn("clip_record", "tenant_id")) {
            columns.add("tenant_id");
            values.add(tenantId);
        }

        StringJoiner columnSql = new StringJoiner(", ");
        StringJoiner placeholderSql = new StringJoiner(", ");
        for (String column : columns) {
            columnSql.add("`" + column + "`");
            placeholderSql.add("?");
        }
        return jdbcTemplate.update(
                "insert into `clip_record` (" + columnSql + ") values (" + placeholderSql + ")",
                values.toArray()) > 0;
    }

    public Map<String, Object> statistics() {
        ensureTableShape();
        Map<String, Object> result = new LinkedHashMap<>();

        LocalDate today = LocalDate.now();
        LocalDate currentMonth = today.withDayOfMonth(1);
        LocalDate lastMonth = today.minusMonths(1).withDayOfMonth(1);
        LocalDate currentYear = today.withDayOfYear(1);

        result.put("todayClippedCount", clipRecordStatusCount(
                CLIPPED_STATUSES, today.atStartOfDay(), today.plusDays(1).atStartOfDay()));
        result.put("todayPendingClipCount", clipRecordStatusCount(
                Arrays.asList(STATUS_PENDING_CLIP), today.atStartOfDay(), today.plusDays(1).atStartOfDay()));
        result.put("currentMonthClipCount", clipRecordStatusCount(
                CLIPPED_STATUSES, currentMonth.atStartOfDay(), currentMonth.plusMonths(1).atStartOfDay()));
        result.put("lastMonthClipCount", clipRecordStatusCount(
                CLIPPED_STATUSES, lastMonth.atStartOfDay(), lastMonth.plusMonths(1).atStartOfDay()));
        result.put("currentYearClipCount", clipRecordStatusCount(
                CLIPPED_STATUSES, currentYear.atStartOfDay(), currentYear.plusYears(1).atStartOfDay()));
        return result;
    }

    public Page<ClipRecord> pageWithSelectionInfo(Page<ClipRecord> page) {
        return pageWithSelectionInfo(page, null);
    }

    public Page<ClipRecord> pageWithSelectionInfo(Page<ClipRecord> page, ClipRecord params) {
        ensureTableShape();
        if (!tableExists("clip_record")) {
            return emptyPage(page);
        }
        if (canJoinSelectionInfo() && tableHasColumn("clip_record", "product_id")) {
            return pageWithSelectionJoin(page, params);
        }
        if (hasText(params == null ? null : params.getProductTitle())
                || hasText(params == null ? null : params.getStatus())) {
            return emptyPage(page);
        }
        if (hasText(params == null ? null : params.getProductId()) && !tableHasColumn("clip_record", "product_id")) {
            return emptyPage(page);
        }

        QueryWrapper<ClipRecord> wrapper = new QueryWrapper<>();
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("clip_record", "tenant_id")) {
            wrapper.eq("tenant_id", tenantId);
        }
        if (params != null && hasText(params.getProductId()) && tableHasColumn("clip_record", "product_id")) {
            wrapper.eq("product_id", params.getProductId().trim());
        }
        wrapper.orderByDesc("id");
        Page<ClipRecord> result = page(page, wrapper);
        fillSelectionInfo(result.getRecords());
        return result;
    }

    private Page<ClipRecord> pageWithSelectionJoin(Page<ClipRecord> page, ClipRecord params) {
        long current = page.getCurrent() <= 0 ? 1 : page.getCurrent();
        long size = page.getSize() <= 0 ? 20 : page.getSize();
        page.setCurrent(current);
        page.setSize(size);

        Long tenantId = TenantUtils.currentTenantId();
        List<Object> latestSelectionArgs = new ArrayList<>();
        String latestSelectionWhere = " where `product_id` is not null and trim(`product_id`) <> ''";
        if (tableHasColumn("product_selection_records", "deleted")) {
            latestSelectionWhere += " and ifnull(`deleted`, 0) = 0";
        }
        if (tenantId != null && tableHasColumn("product_selection_records", "tenant_id")) {
            latestSelectionWhere += " and `tenant_id` = ?";
            latestSelectionArgs.add(tenantId);
        }

        StringBuilder fromSql = new StringBuilder();
        fromSql.append(" from `clip_record` cr ")
                .append("left join (")
                .append("select `product_id`, max(`id`) as `id` from `product_selection_records`")
                .append(latestSelectionWhere)
                .append(" group by `product_id`")
                .append(") latest_psr on latest_psr.`product_id` = cr.`product_id` ")
                .append("left join `product_selection_records` psr on psr.`id` = latest_psr.`id`");

        List<Object> whereArgs = new ArrayList<>();
        StringBuilder whereSql = new StringBuilder(" where 1 = 1");
        if (tableHasColumn("clip_record", "deleted")) {
            whereSql.append(" and ifnull(cr.`deleted`, 0) = 0");
        }
        if (tenantId != null && tableHasColumn("clip_record", "tenant_id")) {
            whereSql.append(" and cr.`tenant_id` = ?");
            whereArgs.add(tenantId);
        }
        if (params != null) {
            if (hasText(params.getProductId())) {
                whereSql.append(" and cr.`product_id` = ?");
                whereArgs.add(params.getProductId().trim());
            }
            if (hasText(params.getProductTitle())) {
                whereSql.append(" and psr.`product_title` like ? escape '!'");
                whereArgs.add(likePattern(params.getProductTitle().trim()));
            }
            if (hasText(params.getStatus())) {
                whereSql.append(" and psr.`status` = ?");
                whereArgs.add(params.getStatus().trim());
            }
        }

        List<Object> countArgs = new ArrayList<>(latestSelectionArgs);
        countArgs.addAll(whereArgs);
        Number total = jdbcTemplate.queryForObject(
                "select count(1)" + fromSql + whereSql,
                countArgs.toArray(),
                Number.class);

        List<Object> selectArgs = new ArrayList<>(countArgs);
        selectArgs.add(size);
        selectArgs.add((current - 1) * size);
        String createTimeSelect = tableHasColumn("clip_record", "create_time") ? "cr.`create_time`" : "null";
        String updateTimeSelect = tableHasColumn("clip_record", "update_time") ? "cr.`update_time`" : "null";
        String deletedSelect = tableHasColumn("clip_record", "deleted") ? "cr.`deleted`" : "null";
        String categoryNameSelect = productCategoryNameSelect("cr.`product_id`", "psr");
        String clipConfigIdSelect = clipConfigIdSelect("psr");
        String clipConfigCodeSelect = clipConfigCodeSelect("psr");
        String reasonSelect = tableHasColumn("product_selection_records", "reason") ? "psr.`reason`" : "null";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select cr.`id`, cr.`product_id`, " +
                        createTimeSelect + " as `create_time`, " +
                        updateTimeSelect + " as `update_time`, " +
                        deletedSelect + " as `deleted`, " +
                        "psr.`product_title`, " +
                        categoryNameSelect + " as `product_category_name`, " +
                        clipConfigIdSelect + " as `clip_config_id`, " +
                        clipConfigCodeSelect + " as `clip_config_code`, " +
                        "psr.`status`, " +
                        reasonSelect + " as `reason`" +
                        fromSql +
                        whereSql +
                        " order by cr.`id` desc limit ? offset ?",
                selectArgs.toArray());
        List<ClipRecord> records = rows.stream()
                .map(this::rowToClipRecord)
                .collect(Collectors.toList());
        page.setTotal(total == null ? 0 : total.longValue());
        page.setRecords(records);
        return page;
    }

    public List<ClipRecord> listPendingClipWithSelectionInfo() {
        ensureTableShape();
        if (!tableExists("clip_record")
                || !tableExists("product_selection_records")
                || !tableHasColumn("clip_record", "product_id")
                || !tableHasColumn("product_selection_records", "product_id")
                || !tableHasColumn("product_selection_records", "status")
                || !tableHasColumn("product_selection_records", "product_title")) {
            return new ArrayList<>();
        }

        Long tenantId = TenantUtils.currentTenantId();
        List<Object> args = new ArrayList<>();
        String latestSelectionWhere = " where `product_id` is not null and trim(`product_id`) <> ''";
        if (tableHasColumn("product_selection_records", "deleted")) {
            latestSelectionWhere += " and ifnull(`deleted`, 0) = 0";
        }
        if (tenantId != null && tableHasColumn("product_selection_records", "tenant_id")) {
            latestSelectionWhere += " and `tenant_id` = ?";
            args.add(tenantId);
        }

        String clipWhere = " where psr.`status` = ?";
        args.add("待剪辑");
        if (tableHasColumn("clip_record", "deleted")) {
            clipWhere += " and ifnull(cr.`deleted`, 0) = 0";
        }
        if (tenantId != null && tableHasColumn("clip_record", "tenant_id")) {
            clipWhere += " and cr.`tenant_id` = ?";
            args.add(tenantId);
        }

        String deletedSelect = tableHasColumn("clip_record", "deleted") ? "cr.`deleted`" : "null";
        String categoryNameSelect = productCategoryNameSelect("cr.`product_id`", "psr");
        String clipConfigIdSelect = clipConfigIdSelect("psr");
        String clipConfigCodeSelect = clipConfigCodeSelect("psr");
        String reasonSelect = tableHasColumn("product_selection_records", "reason") ? "psr.`reason`" : "null";
        String videoTitleSelect = tableHasColumn("product_selection_records", "video_title") ? "psr.`video_title`" : "null";
        String videoCopySelect = tableHasColumn("product_selection_records", "video_copy") ? "psr.`video_copy`" : "null";
        String videoTopicSelect = tableHasColumn("product_selection_records", "video_topic") ? "psr.`video_topic`" : "null";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select cr.`id`, cr.`product_id`, cr.`create_time`, cr.`update_time`, " +
                        deletedSelect + " as `deleted`, " +
                        "psr.`product_title`, " +
                        categoryNameSelect + " as `product_category_name`, " +
                        clipConfigIdSelect + " as `clip_config_id`, " +
                        clipConfigCodeSelect + " as `clip_config_code`, " +
                        "psr.`status`, " +
                        reasonSelect + " as `reason`, " +
                        videoTitleSelect + " as `video_title`, " +
                        videoCopySelect + " as `video_copy`, " +
                        videoTopicSelect + " as `video_topic` " +
                        "from `clip_record` cr " +
                        "join (" +
                        "select `product_id`, max(`id`) as `id` from `product_selection_records`" +
                        latestSelectionWhere +
                        " group by `product_id`" +
                        ") latest_psr on latest_psr.`product_id` = cr.`product_id` " +
                        "join `product_selection_records` psr on psr.`id` = latest_psr.`id`" +
                        clipWhere +
                        " order by cr.`id` desc",
                args.toArray());

        List<ClipRecord> records = rows.stream()
                .map(this::rowToClipRecord)
                .collect(Collectors.toList());
        return records;
    }

    private long clipRecordStatusCount(List<String> statuses, LocalDateTime begin, LocalDateTime end) {
        if (statuses == null || statuses.isEmpty()
                || !tableExists("clip_record")
                || !tableExists("product_selection_records")
                || !tableHasColumn("clip_record", "product_id")
                || !tableHasColumn("product_selection_records", "product_id")
                || !tableHasColumn("product_selection_records", "status")) {
            return 0;
        }
        String timeExpression = clipStatisticTimeExpression();
        if (timeExpression == null) {
            return 0;
        }

        Long tenantId = TenantUtils.currentTenantId();
        List<Object> latestSelectionArgs = new ArrayList<>();
        String latestSelectionWhere = " where `product_id` is not null and trim(`product_id`) <> ''";
        if (tableHasColumn("product_selection_records", "deleted")) {
            latestSelectionWhere += " and ifnull(`deleted`, 0) = 0";
        }
        if (tenantId != null && tableHasColumn("product_selection_records", "tenant_id")) {
            latestSelectionWhere += " and `tenant_id` = ?";
            latestSelectionArgs.add(tenantId);
        }

        StringBuilder fromSql = new StringBuilder();
        fromSql.append(" from `clip_record` cr ")
                .append("join (")
                .append("select `product_id`, max(`id`) as `id` from `product_selection_records`")
                .append(latestSelectionWhere)
                .append(" group by `product_id`")
                .append(") latest_psr on latest_psr.`product_id` = cr.`product_id` ")
                .append("join `product_selection_records` psr on psr.`id` = latest_psr.`id`");

        List<Object> args = new ArrayList<>(latestSelectionArgs);
        List<String> clauses = new ArrayList<>();
        StringJoiner statusPlaceholders = new StringJoiner(", ");
        for (String status : statuses) {
            statusPlaceholders.add("?");
            args.add(status);
        }
        clauses.add("psr.`status` in (" + statusPlaceholders + ")");
        if (tableHasColumn("clip_record", "deleted")) {
            clauses.add("ifnull(cr.`deleted`, 0) = 0");
        }
        if (tenantId != null && tableHasColumn("clip_record", "tenant_id")) {
            clauses.add("cr.`tenant_id` = ?");
            args.add(tenantId);
        }
        clauses.add(timeExpression + " >= ?");
        args.add(begin);
        clauses.add(timeExpression + " < ?");
        args.add(end);

        Number count = jdbcTemplate.queryForObject(
                "select count(1)" + fromSql + " where " + String.join(" and ", clauses),
                args.toArray(),
                Number.class);
        return count == null ? 0 : count.longValue();
    }

    private String clipStatisticTimeExpression() {
        List<String> expressions = new ArrayList<>();
        if (tableHasColumn("product_selection_records", "update_time")) {
            expressions.add("psr.`update_time`");
        }
        if (tableHasColumn("product_selection_records", "create_time")) {
            expressions.add("psr.`create_time`");
        }
        if (tableHasColumn("clip_record", "update_time")) {
            expressions.add("cr.`update_time`");
        }
        if (tableHasColumn("clip_record", "create_time")) {
            expressions.add("cr.`create_time`");
        }
        if (expressions.isEmpty()) {
            return null;
        }
        return expressions.size() == 1 ? expressions.get(0) : "coalesce(" + String.join(", ", expressions) + ")";
    }

    private boolean canJoinSelectionInfo() {
        return tableExists("product_selection_records")
                && tableHasColumn("product_selection_records", "product_id")
                && tableHasColumn("product_selection_records", "status")
                && tableHasColumn("product_selection_records", "product_title");
    }

    private boolean canJoinProductCategory() {
        return tableExists("product_category")
                && tableHasColumn("product_category", "id")
                && tableHasColumn("product_category", "name")
                && tableHasColumn("product_selection_records", "product_category_id");
    }

    private String productCategoryNameSelect(String productIdExpression, String selectionAlias) {
        if (!canJoinProductCategory()) {
            return "null";
        }
        StringBuilder sql = new StringBuilder("(select pc.`name` from `product_selection_records` category_psr ")
                .append("join `product_category` pc on pc.`id` = category_psr.`product_category_id`");
        if (tableHasColumn("product_category", "deleted")) {
            sql.append(" and ifnull(pc.`deleted`, 0) = 0");
        }
        if (tableHasColumn("product_category", "tenant_id")
                && tableHasColumn("product_selection_records", "tenant_id")) {
            sql.append(" and (pc.`tenant_id` = category_psr.`tenant_id`")
                    .append(" or pc.`tenant_id` is null")
                    .append(" or category_psr.`tenant_id` is null)");
        }
        sql.append(" where category_psr.`product_id` = ")
                .append(productIdExpression)
                .append(" and category_psr.`product_category_id` is not null");
        if (tableHasColumn("product_selection_records", "deleted")) {
            sql.append(" and ifnull(category_psr.`deleted`, 0) = 0");
        }
        if (selectionAlias != null && tableHasColumn("product_selection_records", "tenant_id")) {
            sql.append(" and (category_psr.`tenant_id` = ")
                    .append(selectionAlias)
                    .append(".`tenant_id`")
                    .append(" or category_psr.`tenant_id` is null")
                    .append(" or ")
                    .append(selectionAlias)
                    .append(".`tenant_id` is null)");
        }
        sql.append(" order by category_psr.`id` desc limit 1)");
        return sql.toString();
    }

    private String clipConfigIdSelect(String selectionAlias) {
        return clipConfigSelect(selectionAlias, "pc.`clip_config_id`", false);
    }

    private String clipConfigCodeSelect(String selectionAlias) {
        return clipConfigSelect(selectionAlias, "cc.`code`", true);
    }

    private String clipConfigSelect(String selectionAlias, String selectExpression, boolean joinClipConfig) {
        if (!tableExists("publish_account")
                || !tableExists("publish_config")
                || !tableHasColumn("product_selection_records", "account_id")
                || !tableHasColumn("publish_config", "id")
                || !tableHasColumn("publish_config", "clip_config_id")) {
            return "null";
        }
        if (joinClipConfig && (!tableExists("clip_config")
                || !tableHasColumn("clip_config", "id")
                || !tableHasColumn("clip_config", "code"))) {
            return "null";
        }
        String publishAccountColumn = firstExistingTableColumn("publish_account",
                "account_id", "source_account_id", "base_account_id");
        String configColumn = firstExistingTableColumn("publish_account",
                "config_id", "publish_config_id");
        if (publishAccountColumn == null || configColumn == null) {
            return "null";
        }

        StringBuilder sql = new StringBuilder("(select ")
                .append(selectExpression)
                .append(" from `publish_account` pa ")
                .append("join `publish_config` pc on pc.`id` = pa.`")
                .append(configColumn)
                .append("`");
        if (joinClipConfig) {
            sql.append(" join `clip_config` cc on cc.`id` = pc.`clip_config_id`");
        }
        sql.append(" where pa.`")
                .append(publishAccountColumn)
                .append("` = ")
                .append(selectionAlias)
                .append(".`account_id`");
        if (tableHasColumn("publish_account", "deleted")) {
            sql.append(" and ifnull(pa.`deleted`, 0) = 0");
        }
        if (tableHasColumn("publish_config", "deleted")) {
            sql.append(" and ifnull(pc.`deleted`, 0) = 0");
        }
        if (joinClipConfig && tableHasColumn("clip_config", "deleted")) {
            sql.append(" and ifnull(cc.`deleted`, 0) = 0");
        }
        if (tableHasColumn("publish_account", "tenant_id")
                && tableHasColumn("product_selection_records", "tenant_id")) {
            sql.append(" and (pa.`tenant_id` = ")
                    .append(selectionAlias)
                    .append(".`tenant_id`")
                    .append(" or pa.`tenant_id` is null")
                    .append(" or ")
                    .append(selectionAlias)
                    .append(".`tenant_id` is null)");
        }
        if (tableHasColumn("publish_config", "tenant_id")
                && tableHasColumn("product_selection_records", "tenant_id")) {
            sql.append(" and (pc.`tenant_id` = ")
                    .append(selectionAlias)
                    .append(".`tenant_id`")
                    .append(" or pc.`tenant_id` is null")
                    .append(" or ")
                    .append(selectionAlias)
                    .append(".`tenant_id` is null)");
        }
        if (joinClipConfig
                && tableHasColumn("clip_config", "tenant_id")
                && tableHasColumn("product_selection_records", "tenant_id")) {
            sql.append(" and (cc.`tenant_id` = ")
                    .append(selectionAlias)
                    .append(".`tenant_id`")
                    .append(" or cc.`tenant_id` is null")
                    .append(" or ")
                    .append(selectionAlias)
                    .append(".`tenant_id` is null)");
        }
        if (tableHasColumn("publish_account", "id")) {
            sql.append(" order by pa.`id` desc");
        }
        sql.append(" limit 1)");
        return sql.toString();
    }

    private Page<ClipRecord> emptyPage(Page<ClipRecord> page) {
        page.setRecords(new ArrayList<>());
        page.setTotal(0);
        return page;
    }

    private void fillSelectionInfo(List<ClipRecord> records) {
        if (records == null || records.isEmpty() || !tableExists("product_selection_records")
                || !tableHasColumn("product_selection_records", "product_id")
                || !tableHasColumn("product_selection_records", "status")
                || !tableHasColumn("product_selection_records", "product_title")) {
            return;
        }
        List<String> productIds = records.stream()
                .map(ClipRecord::getProductId)
                .filter(value -> value != null && !value.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
        if (productIds.isEmpty()) {
            return;
        }

        StringJoiner placeholders = new StringJoiner(", ");
        List<Object> args = new ArrayList<>();
        for (String productId : productIds) {
            placeholders.add("?");
            args.add(productId);
        }
        String deletedWhere = tableHasColumn("product_selection_records", "deleted")
                ? " and ifnull(psr.`deleted`, 0) = 0"
                : "";
        String categoryNameSelect = productCategoryNameSelect("psr.`product_id`", "psr");
        String clipConfigIdSelect = clipConfigIdSelect("psr");
        String clipConfigCodeSelect = clipConfigCodeSelect("psr");
        String reasonSelect = tableHasColumn("product_selection_records", "reason") ? "psr.`reason`" : "null";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select psr.`product_id`, psr.`product_title`, " +
                        categoryNameSelect + " as `product_category_name`, " +
                        clipConfigIdSelect + " as `clip_config_id`, " +
                        clipConfigCodeSelect + " as `clip_config_code`, " +
                        "psr.`status`, " +
                        reasonSelect + " as `reason` from `product_selection_records` psr" +
                        " where psr.`product_id` in (" + placeholders + ")" +
                        deletedWhere + " order by psr.`id` desc",
                args.toArray());
        Map<String, Map<String, Object>> selectionByProductId = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            Object productId = row.get("product_id");
            if (productId != null) {
                selectionByProductId.putIfAbsent(String.valueOf(productId).trim(), row);
            }
        }
        for (ClipRecord record : records) {
            String productId = record.getProductId();
            if (productId != null) {
                Map<String, Object> selection = selectionByProductId.get(productId.trim());
                if (selection != null) {
                    Object productTitle = selection.get("product_title");
                    Object productCategoryName = selection.get("product_category_name");
                    Object clipConfigId = selection.get("clip_config_id");
                    Object clipConfigCode = selection.get("clip_config_code");
                    Object status = selection.get("status");
                    Object reason = selection.get("reason");
                    record.setProductTitle(productTitle == null ? null : String.valueOf(productTitle));
                    record.setProductCategoryName(productCategoryName == null ? null : String.valueOf(productCategoryName));
                    record.setClipConfigId(longValue(clipConfigId));
                    record.setClipConfigCode(stringValue(clipConfigCode));
                    record.setStatus(status == null ? null : String.valueOf(status));
                    record.setReason(reason == null ? null : String.valueOf(reason));
                }
            }
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String likePattern(String value) {
        return "%" + value
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_") + "%";
    }

    private ClipRecord rowToClipRecord(Map<String, Object> row) {
        ClipRecord record = new ClipRecord();
        record.setId(longValue(row.get("id")));
        record.setProductId(stringValue(row.get("product_id")));
        record.setProductTitle(stringValue(row.get("product_title")));
        record.setProductCategoryName(stringValue(row.get("product_category_name")));
        record.setClipConfigId(longValue(row.get("clip_config_id")));
        record.setClipConfigCode(stringValue(row.get("clip_config_code")));
        record.setStatus(stringValue(row.get("status")));
        record.setReason(stringValue(row.get("reason")));
        record.setVideoTitle(stringValue(row.get("video_title")));
        record.setVideoCopy(stringValue(row.get("video_copy")));
        record.setVideoTopic(stringValue(row.get("video_topic")));
        record.setCreateTime(localDateTime(row.get("create_time")));
        record.setUpdateTime(localDateTime(row.get("update_time")));
        record.setDeleted(intValue(row.get("deleted")));
        return record;
    }

    private void dropColumnIfExists(String columnName) {
        if (tableHasColumn("clip_record", columnName)) {
            jdbcTemplate.execute("alter table `clip_record` drop column `" + columnName + "`");
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

    private Integer intValue(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.valueOf(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private LocalDateTime localDateTime(Object value) {
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        if (value instanceof Timestamp) {
            return ((Timestamp) value).toLocalDateTime();
        }
        if (value instanceof java.util.Date) {
            return new Timestamp(((java.util.Date) value).getTime()).toLocalDateTime();
        }
        return null;
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

    private String firstExistingTableColumn(String tableName, String... columnNames) {
        for (String columnName : columnNames) {
            if (tableHasColumn(tableName, columnName)) {
                return columnName;
            }
        }
        return null;
    }
}
