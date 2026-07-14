package com.lu.admin.modules.publish.service;

import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.shiro.ShiroUtils;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.sys.entity.SysUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PublishRecordService {

    private static final String TABLE_NAME = "publish_record";
    private static final String QUOTED_TABLE_NAME = "`publish_record`";
    private static final String STATUS_PENDING_PUBLISH = "待发布";
    private static final java.util.Set<String> PUBLISH_STATUSES = new java.util.LinkedHashSet<>(
            java.util.Arrays.asList("待发布", "发布中", "发布失败", "发布成功"));

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile boolean publishRecordTableReady = false;

    public Map<String, Object> create(String productId, Long accountId) {
        ensureTableShape();
        String normalizedProductId = productId == null ? "" : productId.trim();
        if (normalizedProductId.isEmpty()) {
            throw new BizException("商品ID不能为空");
        }
        if (accountId == null) {
            throw new BizException("账号ID不能为空");
        }
        if (!hasColumn("product_id") || !hasColumn("account_id")) {
            throw new BizException("publish_record 表缺少 product_id 或 account_id 字段");
        }

        List<String> columns = new java.util.ArrayList<>();
        List<Object> args = new java.util.ArrayList<>();
        addInsertValue(columns, args, "product_id", normalizedProductId);
        addInsertValue(columns, args, "account_id", accountId);
        addInsertValue(columns, args, "status", STATUS_PENDING_PUBLISH);

        String userId = currentUserId();
        if (userId != null && hasColumn("user_id")) {
            addInsertValue(columns, args, "user_id", userId);
        }

        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn("tenant_id")) {
            addInsertValue(columns, args, "tenant_id", tenantId);
        }

        String placeholders = columns.stream().map(column -> "?").collect(java.util.stream.Collectors.joining(", "));
        String columnSql = columns.stream().map(column -> "`" + column + "`").collect(java.util.stream.Collectors.joining(", "));
        String sql = "insert into " + QUOTED_TABLE_NAME + " (" + columnSql + ") values (" + placeholders + ")";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int index = 0; index < args.size(); index++) {
                statement.setObject(index + 1, args.get(index));
            }
            return statement;
        }, keyHolder);

        Map<String, Object> result = new HashMap<>();
        Number id = generatedId(keyHolder, normalizedProductId, accountId, userId, tenantId);
        if (id != null) {
            result.put("id", id.longValue());
        }
        result.put("productId", normalizedProductId);
        result.put("accountId", accountId);
        result.put("status", STATUS_PENDING_PUBLISH);
        result.put("userId", userId);
        result.put("tenantId", tenantId);
        return result;
    }

    public Map<String, Object> findOrCreate(String productId, Long accountId) {
        ensureTableShape();
        String normalizedProductId = productId == null ? "" : productId.trim();
        if (normalizedProductId.isEmpty()) {
            throw new BizException("商品ID不能为空");
        }
        if (accountId == null) {
            throw new BizException("账号ID不能为空");
        }
        if (!hasColumn("id") || !hasColumn("product_id") || !hasColumn("account_id")) {
            throw new BizException("publish_record 表缺少 id、product_id 或 account_id 字段");
        }

        Map<String, Object> existing = latestRecord(normalizedProductId, accountId);
        if (!existing.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            Object id = firstValue(existing, "id");
            if (id instanceof Number) {
                result.put("id", ((Number) id).longValue());
            } else if (id != null) {
                result.put("id", id);
            }
            result.put("productId", normalizedProductId);
            result.put("accountId", accountId);
            result.put("status", firstNonEmpty(firstValue(existing, "status"), STATUS_PENDING_PUBLISH));
            result.put("created", false);
            return result;
        }

        Map<String, Object> created = create(normalizedProductId, accountId);
        created.put("created", true);
        return created;
    }

    private Number generatedId(KeyHolder keyHolder, String productId, Long accountId, String userId, Long tenantId) {
        try {
            Number id = keyHolder.getKey();
            if (id != null) {
                return id;
            }
        } catch (Exception ignored) {
            // Fall back to querying the row just inserted below.
        }
        if (!hasColumn("id")) {
            return null;
        }

        List<Object> args = new java.util.ArrayList<>();
        List<String> clauses = new java.util.ArrayList<>();
        clauses.add("`product_id` = ?");
        args.add(productId);
        clauses.add("`account_id` = ?");
        args.add(accountId);
        if (userId != null && hasColumn("user_id")) {
            clauses.add("`user_id` = ?");
            args.add(userId);
        }
        if (tenantId != null && hasColumn("tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        if (hasColumn("deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select `id` from " + QUOTED_TABLE_NAME + " where " + String.join(" and ", clauses) + " order by `id` desc limit 1",
                args.toArray());
        if (rows.isEmpty()) {
            return null;
        }
        Object id = rows.get(0).get("id");
        if (id instanceof Number) {
            return (Number) id;
        }
        try {
            return Long.valueOf(String.valueOf(id));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    public Map<String, Object> page(Long current, Long size) {
        ensureTableShape();
        long pageCurrent = current == null || current <= 0 ? 1 : current;
        long pageSize = size == null || size <= 0 ? 20 : size;
        long offset = (pageCurrent - 1) * pageSize;

        List<Object> whereArgs = new java.util.ArrayList<>();
        String where = whereSql(whereArgs);
        String order = hasColumn("id") ? " order by `id` desc" : "";
        Number total = jdbcTemplate.queryForObject("select count(1) from " + QUOTED_TABLE_NAME + where,
                whereArgs.toArray(), Number.class);
        List<Object> pageArgs = new java.util.ArrayList<>(whereArgs);
        pageArgs.add(pageSize);
        pageArgs.add(offset);
        List<Map<String, Object>> records = jdbcTemplate.queryForList(
                "select * from " + QUOTED_TABLE_NAME + where + order + " limit ? offset ?",
                pageArgs.toArray());
        enrichRows(records);

        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("total", total == null ? 0 : total.longValue());
        result.put("current", pageCurrent);
        result.put("size", pageSize);
        return result;
    }

    public List<Map<String, Object>> list() {
        ensureTableShape();
        List<Object> whereArgs = new java.util.ArrayList<>();
        String where = whereSql(whereArgs);
        String order = hasColumn("id") ? " order by `id` desc" : "";
        List<Map<String, Object>> records = jdbcTemplate.queryForList("select * from " + QUOTED_TABLE_NAME + where + order,
                whereArgs.toArray());
        enrichRows(records);
        return records;
    }

    public int updateStatusByProductAndAccount(String productId, Long accountId, String status) {
        return updateStatusByProductAndAccount(productId, accountId, status, null);
    }

    public int updateStatusByProductAndAccount(String productId, Long accountId, String status, String reason) {
        ensureTableShape();
        String normalizedProductId = productId == null ? "" : productId.trim();
        String normalizedStatus = normalizePublishStatus(status);
        if (normalizedProductId.isEmpty() || accountId == null || normalizedStatus == null) {
            return 0;
        }
        String normalizedReason = normalizeReason(reason);
        if (!hasColumn("id") || !hasColumn("product_id") || !hasColumn("account_id") || !hasColumn("status")) {
            return 0;
        }
        Number id = latestRecordId(normalizedProductId, accountId);
        if (id == null) {
            return 0;
        }
        List<Object> args = new java.util.ArrayList<>();
        args.add(normalizedStatus);
        StringBuilder sql = new StringBuilder("update ")
                .append(QUOTED_TABLE_NAME)
                .append(" set `status` = ?");
        if ("发布成功".equals(normalizedStatus) && hasColumn("publish_time")) {
            sql.append(", `publish_time` = coalesce(`publish_time`, ?)");
            args.add(LocalDateTime.now());
        }
        if (hasColumn("reason")) {
            sql.append(", `reason` = ?");
            args.add(isFailedStatus(normalizedStatus) ? normalizedReason : null);
        }
        sql.append(" where `id` = ?");
        args.add(id);
        return jdbcTemplate.update(sql.toString(), args.toArray());
    }

    public Map<String, Object> updateStatus(Long id, String status) {
        return updateStatus(id, status, null);
    }

    public Map<String, Object> updateStatus(Long id, String status, String reason) {
        ensureTableShape();
        if (id == null) {
            throw new BizException("发布记录ID不能为空");
        }
        String normalizedStatus = normalizePublishStatus(status);
        if (normalizedStatus == null) {
            throw new BizException("状态只允许为" + String.join("、", PUBLISH_STATUSES));
        }
        String normalizedReason = normalizeReason(reason);
        if (isFailedStatus(normalizedStatus) && normalizedReason == null) {
            throw new BizException("失败状态必须提交原因");
        }
        if (!hasColumn("id") || !hasColumn("status")) {
            throw new BizException("publish_record 表缺少 id 或 status 字段");
        }

        Map<String, Object> record = loadRecordById(id, true);
        if (record.isEmpty()) {
            throw new BizException("发布记录不存在或无权限");
        }
        Object oldStatusValue = firstValue(record, "status");
        String oldStatus = oldStatusValue == null ? null : String.valueOf(oldStatusValue);
        boolean successTransition = "发布成功".equals(normalizedStatus) && !"发布成功".equals(oldStatus);
        Object productValue = firstValue(record, "product_id", "productId");
        String productId = productValue == null ? "" : String.valueOf(productValue).trim();
        if (productId.isEmpty()) {
            throw new BizException("发布记录缺少商品ID");
        }
        Long accountId = longValue(firstValue(record, "account_id", "accountId"));
        if ("发布成功".equals(normalizedStatus) && accountId == null) {
            throw new BizException("发布记录缺少账号ID");
        }

        List<Object> args = new java.util.ArrayList<>();
        args.add(normalizedStatus);
        StringBuilder sql = new StringBuilder("update ")
                .append(QUOTED_TABLE_NAME)
                .append(" set `status` = ?");
        if ("发布成功".equals(normalizedStatus) && hasColumn("publish_time")) {
            sql.append(", `publish_time` = coalesce(`publish_time`, ?)");
            args.add(LocalDateTime.now());
        }
        if (hasColumn("reason")) {
            sql.append(", `reason` = ?");
            args.add(isFailedStatus(normalizedStatus) ? normalizedReason : null);
        }
        sql.append(" where `id` = ?");
        args.add(id);
        if (hasColumn("deleted")) {
            sql.append(" and ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn("tenant_id")) {
            sql.append(" and `tenant_id` = ?");
            args.add(tenantId);
        }
        int publishRecordUpdated = jdbcTemplate.update(sql.toString(), args.toArray());
        if (publishRecordUpdated <= 0) {
            throw new BizException("发布记录不存在或无权限");
        }
        int selectionRecordUpdated = updateSelectionRecordStatus(productId, normalizedStatus, normalizedReason);

        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("productId", productId);
        result.put("accountId", accountId);
        result.put("status", normalizedStatus);
        result.put("oldStatus", oldStatus);
        result.put("successTransition", successTransition);
        result.put("reason", normalizedReason);
        result.put("publishRecordUpdated", publishRecordUpdated);
        result.put("selectionRecordUpdated", selectionRecordUpdated);
        return result;
    }

    private synchronized void ensureTableShape() {
        if (publishRecordTableReady) {
            return;
        }
        requireTable();
        ensureColumn("status",
                "varchar(50) character set utf8mb4 collate utf8mb4_unicode_ci null default '待发布' comment '发布状态：待发布、发布中、发布失败、发布成功'");
        if (hasColumn("status")) {
            jdbcTemplate.update("update " + QUOTED_TABLE_NAME + " set `status` = ? where `status` is null or trim(`status`) = ''",
                    STATUS_PENDING_PUBLISH);
        }
        ensureColumn("reason",
                "varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '原因'");
        publishRecordTableReady = true;
    }

    private void ensureColumn(String columnName, String columnDefinition) {
        if (!hasColumn(columnName)) {
            jdbcTemplate.execute("alter table " + QUOTED_TABLE_NAME + " add column `" + columnName + "` " + columnDefinition);
        }
    }

    private String normalizePublishStatus(String status) {
        String value = status == null ? "" : status.trim();
        return PUBLISH_STATUSES.contains(value) ? value : null;
    }

    private boolean isFailedStatus(String status) {
        return status != null && status.trim().endsWith("失败");
    }

    private String normalizeReason(String reason) {
        if (reason == null) {
            return null;
        }
        String value = reason.trim();
        if (value.isEmpty()) {
            return null;
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private Number latestRecordId(String productId, Long accountId) {
        Map<String, Object> row = latestRecord(productId, accountId);
        Object id = firstValue(row, "id");
        if (id instanceof Number) {
            return (Number) id;
        }
        if (id != null) {
            try {
                return Long.valueOf(String.valueOf(id));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Map<String, Object> latestRecord(String productId, Long accountId) {
        List<Object> args = new java.util.ArrayList<>();
        List<String> clauses = new java.util.ArrayList<>();
        clauses.add("`product_id` = ?");
        args.add(productId);
        clauses.add("`account_id` = ?");
        args.add(accountId);
        if (hasColumn("deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn("tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select * from " + QUOTED_TABLE_NAME + " where " + String.join(" and ", clauses) + " order by `id` desc limit 1",
                args.toArray());
        if (rows.isEmpty()) {
            return new HashMap<>();
        }
        return rows.get(0);
    }

    private Map<String, Object> loadRecordById(Long id) {
        return loadRecordById(id, false);
    }

    private Map<String, Object> loadRecordById(Long id, boolean forUpdate) {
        List<Object> args = new java.util.ArrayList<>();
        List<String> clauses = new java.util.ArrayList<>();
        clauses.add("`id` = ?");
        args.add(id);
        if (hasColumn("deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn("tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select * from " + QUOTED_TABLE_NAME + " where " + String.join(" and ", clauses) + " limit 1" +
                        (forUpdate ? " for update" : ""),
                args.toArray());
        return rows.isEmpty() ? new HashMap<>() : rows.get(0);
    }

    private int updateSelectionRecordStatus(String productId, String status, String reason) {
        if (productId == null || productId.trim().isEmpty()) {
            throw new BizException("商品ID不能为空");
        }
        if (!tableExists("product_selection_records")) {
            throw new BizException("未找到 product_selection_records 表");
        }
        if (!tableHasColumn("product_selection_records", "product_id")
                || !tableHasColumn("product_selection_records", "status")) {
            throw new BizException("product_selection_records 表缺少 product_id 或 status 字段");
        }
        ensureSelectionReasonColumn();

        List<Object> args = new java.util.ArrayList<>();
        args.add(status);
        boolean updateReason = tableHasColumn("product_selection_records", "reason");
        if (updateReason) {
            args.add(isFailedStatus(status) ? reason : null);
        }
        args.add(productId.trim());
        List<String> clauses = new java.util.ArrayList<>();
        clauses.add("`product_id` = ?");
        if (tableHasColumn("product_selection_records", "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("product_selection_records", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        String setSql = updateReason ? "`status` = ?, `reason` = ?" : "`status` = ?";
        int updated = jdbcTemplate.update("update `product_selection_records` set " + setSql + " where " +
                String.join(" and ", clauses), args.toArray());
        if (updated <= 0) {
            throw new BizException("商品ID对应的选品记录不存在或无权限");
        }
        return updated;
    }

    private void ensureSelectionReasonColumn() {
        if (tableExists("product_selection_records") && !tableHasColumn("product_selection_records", "reason")) {
            jdbcTemplate.execute("alter table `product_selection_records` add column `reason` " +
                    "varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '原因'");
        }
    }

    private String whereSql(List<Object> args) {
        List<String> clauses = new java.util.ArrayList<>();
        if (hasColumn("deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn("tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        return clauses.isEmpty() ? "" : " where " + String.join(" and ", clauses);
    }

    private void enrichRows(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        Map<String, String> sysUserNames = sysUserNameMap();
        Map<String, String> userNames = userNameMap();
        Map<String, Map<String, Object>> selectionRecords = selectionRecordMap(rows);
        Map<String, String> accountNicknames = accountNicknameMap(rows);
        for (Map<String, Object> row : rows) {
            Object ownerId = firstValue(row, "user_id", "userId");
            Object selectionApproverId = firstValue(row, "selection_approver_user_id", "selectionApproverUserId");
            Object publishApproverId = firstValue(row, "publish_approver_user_id", "publishApproverUserId");
            Object productId = firstValue(row, "product_id", "productId", "goods_id", "item_id");
            Object accountId = firstValue(row, "account_id", "accountId");
            Map<String, Object> selectionRecord = productId == null ? null : selectionRecords.get(String.valueOf(productId));

            row.put("displayProductId", productId);
            row.put("displayProductTitle", firstNonEmpty(
                    firstValue(row, "product_title", "productTitle", "goods_title", "item_title", "title", "video_title"),
                    selectionRecord == null ? null : firstValue(selectionRecord, "product_title", "productTitle")));
            row.put("displayProductLink", firstNonEmpty(
                    firstValue(row, "product_link", "productLink", "goods_link", "item_link", "product_url", "url"),
                    selectionRecord == null ? null : firstValue(selectionRecord, "product_link", "productLink")));
            Object reason = firstNonEmpty(
                    selectionRecord == null ? null : firstValue(selectionRecord, "reason"),
                    firstValue(row, "reason"));
            row.put("reason", reason);
            row.put("displayReason", reason);
            row.put("displayAccountNickname", firstNonEmpty(
                    firstValue(row, "account_nickname", "accountNickname", "nickname", "account_name", "accountName"),
                    accountId == null ? null : accountNicknames.get(String.valueOf(accountId)),
                    accountId));
            row.put("displayStatus", firstNonEmpty(firstValue(row, "status"), STATUS_PENDING_PUBLISH));
            row.put("displayCreateTime", firstValue(row, "create_time", "createTime"));
            row.put("displayTrailerLink", firstValue(row, "trailer_link", "trailerLink", "cart_link", "shopping_cart_link"));
            row.put("displayCategory", firstValue(row, "category", "category_name", "cate_name"));
            row.put("displayCommission", firstValue(row, "commission"));
            row.put("displayCommissionRate", firstValue(row, "commission_rate", "commissionRate"));
            row.put("displayPrice", firstValue(row, "price"));
            row.put("displaySalesRatio", firstValue(row, "sales_ratio", "salesRatio", "order_ratio", "orderRatio"));
            row.put("displayProductRating", firstValue(row, "product_rating", "productRating", "rating", "score"));
            row.put("displayTotalSales", firstValue(row, "total_sales", "totalSales", "sales", "sales_volume"));
            row.put("displaySellerCount", firstValue(row, "seller_count", "sellerCount", "author_count", "daren_count"));
            row.put("displayShopName", firstValue(row, "shop_name", "shopName", "store_name"));
            row.put("displaySelectionAccountNickname", firstValue(row, "selection_account_nickname", "selectionAccountNickname",
                    "selection_nickname", "account_nickname", "account_name"));
            row.put("displayStrategyName", firstValue(row, "strategy_name", "strategyName"));
            row.put("displaySelectionApprover", firstNonEmpty(
                    firstValue(row, "selection_approver_name", "selectionApproverName", "selection_approver"),
                    selectionApproverId == null ? null : sysUserNames.get(String.valueOf(selectionApproverId)),
                    selectionApproverId));
            row.put("displayPublishApprover", firstNonEmpty(
                    firstValue(row, "publish_approver_name", "publishApproverName", "publish_approver"),
                    publishApproverId == null ? null : sysUserNames.get(String.valueOf(publishApproverId)),
                    publishApproverId));
            row.put("displayOwner", firstNonEmpty(
                    firstValue(row, "owner_name", "user_name", "username", "uname"),
                    ownerId == null ? null : sysUserNames.get(String.valueOf(ownerId)),
                    ownerId == null ? null : userNames.get(String.valueOf(ownerId)),
                    ownerId));
        }
    }

    private Map<String, Map<String, Object>> selectionRecordMap(List<Map<String, Object>> rows) {
        Map<String, Map<String, Object>> result = new HashMap<>();
        if (!tableExists("product_selection_records") || !tableHasColumn("product_selection_records", "product_id")) {
            return result;
        }
        java.util.Set<String> productIds = new java.util.LinkedHashSet<>();
        for (Map<String, Object> row : rows) {
            Object productId = firstValue(row, "product_id", "productId", "goods_id", "item_id");
            if (productId != null) {
                productIds.add(String.valueOf(productId));
            }
        }
        if (productIds.isEmpty()) {
            return result;
        }

        String titleColumn = firstExistingTableColumn("product_selection_records",
                "product_title", "goods_title", "item_title", "title", "video_title");
        String linkColumn = firstExistingTableColumn("product_selection_records",
                "product_link", "trailer_link", "goods_link", "item_link", "product_url", "url");
        String reasonColumn = firstExistingTableColumn("product_selection_records", "reason");
        String placeholders = productIds.stream().map(id -> "?").collect(java.util.stream.Collectors.joining(","));
        List<Object> args = new java.util.ArrayList<>(productIds);
        List<String> clauses = new java.util.ArrayList<>();
        clauses.add("`product_id` in (" + placeholders + ")");
        if (tableHasColumn("product_selection_records", "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("product_selection_records", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        String order = tableHasColumn("product_selection_records", "id") ? " order by `id` desc" : "";
        List<Map<String, Object>> selectionRows = jdbcTemplate.queryForList(
                "select `product_id`, " + selectExpression(titleColumn) + " as `product_title`, " +
                        selectExpression(linkColumn) + " as `product_link`, " +
                        selectExpression(reasonColumn) + " as `reason` from `product_selection_records` where " +
                        String.join(" and ", clauses) + order,
                args.toArray());
        for (Map<String, Object> row : selectionRows) {
            Object productId = firstValue(row, "product_id", "productId");
            if (productId != null) {
                result.putIfAbsent(String.valueOf(productId), row);
            }
        }
        return result;
    }

    private Map<String, String> accountNicknameMap(List<Map<String, Object>> rows) {
        Map<String, String> result = new HashMap<>();
        if (!tableExists("account") || !tableHasColumn("account", "id")) {
            return result;
        }
        java.util.Set<String> accountIds = new java.util.LinkedHashSet<>();
        for (Map<String, Object> row : rows) {
            Object accountId = firstValue(row, "account_id", "accountId");
            if (accountId != null) {
                accountIds.add(String.valueOf(accountId));
            }
        }
        if (accountIds.isEmpty()) {
            return result;
        }

        String nicknameColumn = firstExistingTableColumn("account",
                "nickname", "nick_name", "nick", "account_name", "name", "douyin_account", "baiying_id");
        String placeholders = accountIds.stream().map(id -> "?").collect(java.util.stream.Collectors.joining(","));
        List<Object> args = new java.util.ArrayList<>(accountIds);
        List<String> clauses = new java.util.ArrayList<>();
        clauses.add("`id` in (" + placeholders + ")");
        if (tableHasColumn("account", "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("account", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> accountRows = jdbcTemplate.queryForList(
                "select `id`, " + selectExpression(nicknameColumn) + " as `nickname` from `account` where " +
                        String.join(" and ", clauses),
                args.toArray());
        for (Map<String, Object> row : accountRows) {
            Object id = firstValue(row, "id");
            Object nickname = firstValue(row, "nickname");
            if (id != null && nickname != null) {
                result.put(String.valueOf(id), String.valueOf(nickname));
            }
        }
        return result;
    }

    private String firstExistingTableColumn(String tableName, String... names) {
        for (String name : names) {
            if (tableHasColumn(tableName, name)) {
                return name;
            }
        }
        return null;
    }

    private String selectExpression(String column) {
        return column == null ? "null" : "`" + column.replace("`", "``") + "`";
    }

    private Map<String, String> sysUserNameMap() {
        if (!tableExists("sys_user") || !tableHasColumn("sys_user", "uid")) {
            return new HashMap<>();
        }
        String nameColumn = tableHasColumn("sys_user", "nick") ? "nick" : "uname";
        if (!tableHasColumn("sys_user", nameColumn)) {
            return new HashMap<>();
        }
        java.util.List<Object> args = new java.util.ArrayList<>();
        String where = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("sys_user", "tenant_id")) {
            where = " where `tenant_id` = ?";
            args.add(tenantId);
        }
        return toStringMap(jdbcTemplate.queryForList("select `uid`, `" + nameColumn + "` as `name` from `sys_user`" + where,
                args.toArray()), "uid", "name");
    }

    private Map<String, String> userNameMap() {
        if (!tableExists("user") || !tableHasColumn("user", "id")) {
            return new HashMap<>();
        }
        String nameColumn = tableHasColumn("user", "nick_name") ? "nick_name" : "account";
        if (!tableHasColumn("user", nameColumn)) {
            return new HashMap<>();
        }
        java.util.List<Object> args = new java.util.ArrayList<>();
        String where = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("user", "tenant_id")) {
            where = " where `tenant_id` = ?";
            args.add(tenantId);
        }
        return toStringMap(jdbcTemplate.queryForList("select `id`, `" + nameColumn + "` as `name` from `user`" + where,
                args.toArray()), "id", "name");
    }

    private Map<String, String> toStringMap(List<Map<String, Object>> rows, String key, String value) {
        Map<String, String> map = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Object id = firstValue(row, key);
            Object name = firstValue(row, value);
            if (id != null && name != null) {
                map.put(String.valueOf(id), String.valueOf(name));
            }
        }
        return map;
    }

    private void requireTable() {
        if (!tableExists(TABLE_NAME)) {
            throw new BizException("未找到 publish_record 表");
        }
    }

    private boolean hasColumn(String columnName) {
        return tableHasColumn(TABLE_NAME, columnName);
    }

    private void addInsertValue(List<String> columns, List<Object> args, String columnName, Object value) {
        if (hasColumn(columnName)) {
            columns.add(columnName);
            args.add(value);
        }
    }

    private String currentUserId() {
        try {
            SysUser user = ShiroUtils.getSysUser();
            return user == null ? null : user.getUid();
        } catch (Exception ignored) {
            return null;
        }
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

    private Object firstValue(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (key.equalsIgnoreCase(entry.getKey()) && !isEmpty(entry.getValue())) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private Object firstNonEmpty(Object... values) {
        for (Object value : values) {
            if (!isEmpty(value)) {
                return value;
            }
        }
        return null;
    }

    private boolean isEmpty(Object value) {
        return value == null || String.valueOf(value).trim().isEmpty();
    }

    private Long longValue(Object value) {
        if (isEmpty(value)) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.valueOf(String.valueOf(value).trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
