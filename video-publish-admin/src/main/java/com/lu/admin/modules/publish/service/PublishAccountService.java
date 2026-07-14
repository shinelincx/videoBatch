package com.lu.admin.modules.publish.service;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.shiro.ShiroUtils;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.baseconfig.entity.Robot;
import com.lu.admin.modules.baseconfig.service.RobotService;
import com.lu.admin.modules.publish.dto.PublishAccountLoginRequest;
import com.lu.admin.modules.publish.dto.PublishAccountStartPublishRequest;
import com.lu.admin.modules.sys.entity.SysUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Queue;
import java.util.Set;
import java.util.StringJoiner;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors;

@Service
public class PublishAccountService {

    private static final String TABLE_NAME = "publish_account";
    private static final String QUOTED_TABLE_NAME = "`publish_account`";
    private static final String PUBLISH_CONDITION_TABLE_NAME = "publish_condition";
    private static final String QUOTED_PUBLISH_CONDITION_TABLE_NAME = "`publish_condition`";
    private static final String DAILY_PUBLISH_COUNT_TABLE_NAME = "account_daily_publish_count";
    private static final String QUOTED_DAILY_PUBLISH_COUNT_TABLE_NAME = "`account_daily_publish_count`";
    private static final String STATUS_PENDING_PUBLISH = "待发布";
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final Set<String> SYSTEM_COLUMNS = new HashSet<>(Arrays.asList(
            "id", "create_time", "update_time", "deleted",
            "login_status", "login_error_reason"
    ));
    private static final Set<String> LOGIN_STATUSES = new HashSet<>(Arrays.asList(
            "未登录", "已登录", "异常"
    ));
    private static final int LOGIN_ERROR_REASON_MAX_LENGTH = 500;
    private static final Queue<Map<String, Object>> PUBLISH_ACCOUNT_TASKS = new ConcurrentLinkedQueue<>();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PublishRecordService publishRecordService;

    @Autowired
    private RobotService robotService;

    public List<Map<String, Object>> columns() {
        ensurePublishAccountLoginColumns();
        String sql = "select COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, COLUMN_COMMENT, IS_NULLABLE, " +
                "COLUMN_DEFAULT, COLUMN_KEY, EXTRA from information_schema.COLUMNS " +
                "where TABLE_SCHEMA = DATABASE() and TABLE_NAME = ? order by ORDINAL_POSITION";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, TABLE_NAME);
        List<Map<String, Object>> columns = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String name = stringValue(row, "COLUMN_NAME");
            String extra = stringValue(row, "EXTRA");
            String columnKey = stringValue(row, "COLUMN_KEY");
            String comment = stringValue(row, "COLUMN_COMMENT");
            boolean system = SYSTEM_COLUMNS.contains(name.toLowerCase());

            Map<String, Object> column = new LinkedHashMap<>();
            column.put("name", name);
            column.put("label", isEmpty(comment) ? labelOf(name) : comment);
            column.put("dataType", stringValue(row, "DATA_TYPE"));
            column.put("columnType", stringValue(row, "COLUMN_TYPE"));
            column.put("comment", comment);
            column.put("nullable", "YES".equalsIgnoreCase(stringValue(row, "IS_NULLABLE")));
            column.put("defaultValue", value(row, "COLUMN_DEFAULT"));
            column.put("primaryKey", "PRI".equalsIgnoreCase(columnKey));
            column.put("autoIncrement", extra != null && extra.toLowerCase().contains("auto_increment"));
            column.put("system", system);
            column.put("editable", !system);
            columns.add(column);
        }
        return columns;
    }

    public Map<String, Object> page(Long current, Long size) {
        List<Map<String, Object>> columns = requireColumns();
        ensureBaseAccountLastLoginTimeColumn();
        long pageCurrent = current == null || current <= 0 ? 1 : current;
        long pageSize = size == null || size <= 0 ? 20 : size;
        long offset = (pageCurrent - 1) * pageSize;

        List<Object> whereArgs = new ArrayList<>();
        String where = whereSql(columns, whereArgs);
        String order = hasColumn(columns, "id") ? " order by `id` desc" : "";
        Number total = jdbcTemplate.queryForObject("select count(1) from " + QUOTED_TABLE_NAME + where,
                whereArgs.toArray(), Number.class);
        List<Object> pageArgs = new ArrayList<>(whereArgs);
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
        List<Map<String, Object>> columns = requireColumns();
        ensureBaseAccountLastLoginTimeColumn();
        List<Object> whereArgs = new ArrayList<>();
        String where = whereSql(columns, whereArgs);
        String order = hasColumn(columns, "id") ? " order by `id` desc" : "";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("select * from " + QUOTED_TABLE_NAME + where + order,
                whereArgs.toArray());
        enrichRows(rows);
        return rows;
    }

    public Map<String, Object> statistics() {
        List<Map<String, Object>> columns = requireColumns();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accountCount", publishAccountCount(columns));

        LocalDate today = LocalDate.now();
        result.put("publishedCount", publishRecordStatusCountByRecordTime("发布成功", today, today));
        result.put("pendingPublishCount", publishRecordStatusCountByRecordTime(STATUS_PENDING_PUBLISH, today, today));

        LocalDate currentMonthBegin = today.withDayOfMonth(1);
        LocalDate currentMonthEnd = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate lastMonth = today.minusMonths(1);
        LocalDate lastMonthBegin = lastMonth.withDayOfMonth(1);
        LocalDate lastMonthEnd = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
        result.put("currentMonthPublishCount", monthPublishCount(currentMonthBegin, currentMonthEnd));
        result.put("lastMonthPublishCount", monthPublishCount(lastMonthBegin, lastMonthEnd));
        return result;
    }

    private long publishAccountCount(List<Map<String, Object>> columns) {
        List<Object> args = new ArrayList<>();
        String where = whereSql(columns, args);
        Number count = jdbcTemplate.queryForObject("select count(1) from " + QUOTED_TABLE_NAME + where,
                args.toArray(), Number.class);
        return count == null ? 0 : count.longValue();
    }

    private long monthPublishCount(LocalDate begin, LocalDate end) {
        return publishRecordStatusCountByRecordTime("发布成功", begin, end);
    }

    private long publishRecordStatusCountByRecordTime(String status, LocalDate begin, LocalDate end) {
        if (!tableExists("publish_record")
                || !tableHasColumn("publish_record", "status")) {
            return 0;
        }
        boolean hasPublishTime = tableHasColumn("publish_record", "publish_time");
        boolean hasCreateTime = tableHasColumn("publish_record", "create_time");
        if (!hasPublishTime && !hasCreateTime) {
            return 0;
        }
        String timeExpression = publishRecordTimeExpression(hasPublishTime, hasCreateTime);
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("`status` = ?");
        args.add(status);
        clauses.add(timeExpression + " >= ?");
        args.add(begin.atStartOfDay());
        clauses.add(timeExpression + " < ?");
        args.add(end.plusDays(1).atStartOfDay());
        appendPublishRecordFilters(clauses, args);
        Number count = jdbcTemplate.queryForObject("select count(1) from `publish_record` where " +
                        String.join(" and ", clauses),
                args.toArray(), Number.class);
        return count == null ? 0 : count.longValue();
    }

    private String publishRecordTimeExpression(boolean hasPublishTime, boolean hasCreateTime) {
        if (hasPublishTime && hasCreateTime) {
            return "coalesce(`publish_time`, `create_time`)";
        }
        return hasPublishTime ? "`publish_time`" : "`create_time`";
    }

    private void appendPublishRecordFilters(List<String> clauses, List<Object> args) {
        if (tableHasColumn("publish_record", "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("publish_record", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void create(Map<String, Object> body) {
        List<Map<String, Object>> columns = requireColumns();
        boolean hasPublishConditions = hasPublishConditionsPayload(body);
        List<Map<String, Object>> publishConditions = hasPublishConditions
                ? normalizePublishConditions(body)
                : Collections.emptyList();
        LinkedHashMap<String, Object> values = editableValues(body, columns);

        Map<String, Object> idColumn = findColumn(columns, "id");
        if (idColumn != null && !Boolean.TRUE.equals(idColumn.get("autoIncrement"))) {
            Object id = body == null ? null : body.get("id");
            values.put("id", isEmpty(id) ? IdWorker.getId() : id);
        }
        if (hasColumn(columns, "deleted") && !values.containsKey("deleted")) {
            values.put("deleted", 0);
        }
        if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
            values.put("tenant_id", TenantUtils.currentTenantId());
        }
        if (values.isEmpty()) {
            throw new BizException("发布账号没有可保存字段");
        }

        Object publishAccountId = insertValues(values);
        if (hasPublishConditions) {
            replacePublishConditions(publishAccountId, publishConditions);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void update(Map<String, Object> body) {
        List<Map<String, Object>> columns = requireColumns();
        Object id = body == null ? null : body.get("id");
        if (isEmpty(id)) {
            throw new BizException("无法更新发布账号：参数为空（id）");
        }
        boolean hasPublishConditions = hasPublishConditionsPayload(body);
        boolean hasSelectionAudit = body != null
                && (body.containsKey("selection_audit") || body.containsKey("selectionAudit"));
        List<Map<String, Object>> publishConditions = hasPublishConditions
                ? normalizePublishConditions(body)
                : Collections.emptyList();

        LinkedHashMap<String, Object> values = editableValues(body, columns);
        if (values.isEmpty() && !hasPublishConditions && !hasSelectionAudit) {
            throw new BizException("发布账号没有可更新字段");
        }

        if (!values.isEmpty()) {
            StringJoiner setPart = new StringJoiner(", ");
            List<Object> args = new ArrayList<>();
            for (Map.Entry<String, Object> entry : values.entrySet()) {
                setPart.add(quote(entry.getKey()) + " = ?");
                args.add(entry.getValue());
            }
            args.add(id);
            String tenantWhere = "";
            if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
                tenantWhere = " and `tenant_id` = ?";
                args.add(TenantUtils.currentTenantId());
            }
            jdbcTemplate.update("update " + QUOTED_TABLE_NAME + " set " + setPart + " where `id` = ?" + tenantWhere,
                    args.toArray());
        }
        if (hasPublishConditions) {
            replacePublishConditions(id, publishConditions);
        }
        updatePublishConfigSelectionAudit(body);
    }

    public void syncStatus(Map<String, Object> body) {
        List<Map<String, Object>> columns = requireColumns();
        Object accountId = body == null ? null : firstNonEmpty(body.get("accountId"), body.get("account_id"));
        Object status = body == null ? null : firstNonEmpty(body.get("status"), body.get("currentStatus"), body.get("current_status"));
        Object loginStatus = body == null ? null : firstNonEmpty(body.get("loginStatus"), body.get("login_status"));
        Object loginErrorReason = body == null ? null : firstNonEmpty(
                body.get("loginErrorReason"), body.get("login_error_reason"), body.get("errorReason"), body.get("reason"));
        if (isEmpty(loginStatus) && isLoginStatus(status)) {
            loginStatus = status;
            status = null;
        }
        if (isEmpty(accountId)) {
            throw new BizException("无法同步发布账号状态：参数为空（accountId）");
        }
        if (isEmpty(status) && isEmpty(loginStatus)) {
            throw new BizException("无法同步发布账号状态：参数为空（status）");
        }
        if (!hasColumn(columns, "account_id")) {
            throw new BizException("publish_account 缺少 account_id 字段");
        }

        LinkedHashMap<String, Object> values = new LinkedHashMap<>();
        if (!isEmpty(status)) {
            Map<String, Object> statusColumn = findRuntimeStatusColumn(columns);
            if (statusColumn != null) {
                values.put(String.valueOf(statusColumn.get("name")), status);
            }
        }
        if (!isEmpty(loginStatus)) {
            addLoginStatusValues(values, columns, loginStatus, loginErrorReason);
        }
        if (values.isEmpty()) {
            return;
        }

        updateByAccountId(accountId, values, columns);
    }

    private void addLoginStatusValues(LinkedHashMap<String, Object> values,
                                      List<Map<String, Object>> columns,
                                      Object loginStatus,
                                      Object loginErrorReason) {
        Map<String, Object> loginStatusColumn = findColumn(columns, "login_status");
        if (loginStatusColumn == null) {
            return;
        }
        String normalizedStatus = normalizeLoginStatus(loginStatus);
        values.put(String.valueOf(loginStatusColumn.get("name")), normalizedStatus);

        Map<String, Object> reasonColumn = findColumn(columns, "login_error_reason");
        if (reasonColumn == null) {
            return;
        }
        String reason = normalizeLoginErrorReason(loginErrorReason);
        if ("异常".equals(normalizedStatus) && isEmpty(reason)) {
            reason = "客户端未提供异常原因";
        }
        values.put(String.valueOf(reasonColumn.get("name")), "异常".equals(normalizedStatus) ? reason : null);
    }

    private String normalizeLoginStatus(Object status) {
        String text = String.valueOf(status == null ? "" : status).trim();
        if (LOGIN_STATUSES.contains(text)) {
            return text;
        }
        if ("logged_in".equalsIgnoreCase(text) || "success".equalsIgnoreCase(text)) {
            return "已登录";
        }
        if ("error".equalsIgnoreCase(text) || "failed".equalsIgnoreCase(text) || "failure".equalsIgnoreCase(text)) {
            return "异常";
        }
        return "未登录";
    }

    private String normalizeLoginErrorReason(Object reason) {
        if (reason == null) {
            return null;
        }
        String text = String.valueOf(reason).trim();
        if (text.length() > LOGIN_ERROR_REASON_MAX_LENGTH) {
            return text.substring(0, LOGIN_ERROR_REASON_MAX_LENGTH);
        }
        return text;
    }

    private boolean isLoginStatus(Object status) {
        if (isEmpty(status)) {
            return false;
        }
        return LOGIN_STATUSES.contains(String.valueOf(status).trim());
    }

    private void updateByAccountId(Object accountId, LinkedHashMap<String, Object> values, List<Map<String, Object>> columns) {
        StringJoiner setPart = new StringJoiner(", ");
        List<Object> args = new ArrayList<>();
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            setPart.add(quote(entry.getKey()) + " = ?");
            args.add(entry.getValue());
        }
        args.add(accountId);
        StringBuilder sql = new StringBuilder("update ")
                .append(QUOTED_TABLE_NAME)
                .append(" set ")
                .append(setPart)
                .append(" where `account_id` = ?");
        if (hasColumn(columns, "deleted")) {
            sql.append(" and `deleted` = 0");
        }
        if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
            sql.append(" and `tenant_id` = ?");
            args.add(TenantUtils.currentTenantId());
        }
        jdbcTemplate.update(sql.toString(), args.toArray());
    }

    public Map<String, Object> login(PublishAccountLoginRequest body) {
        Long publishAccountId = body == null ? null : body.getPublishAccountId();
        Long robotId = body == null ? null : body.getRobotId();
        if (publishAccountId == null) {
            throw new BizException("请选择发布账号");
        }
        Map<String, Object> publishAccount = loadPublishAccount(publishAccountId);
        if (publishAccount.isEmpty()) {
            throw new BizException("发布账号不存在或无权操作");
        }
        return pushLoginCommand(publishAccount, robotId);
    }

    public Map<String, Object> loginByAccountId(Long accountId, Long robotId) {
        if (accountId == null) {
            throw new BizException("请选择账号");
        }
        Map<String, Object> publishAccount = loadPublishAccountByAccountId(accountId);
        if (publishAccount.isEmpty()) {
            throw new BizException("该账号未添加到发布账号，无法推送登录需求");
        }
        return pushLoginCommand(publishAccount, robotId);
    }

    private Map<String, Object> pushLoginCommand(Map<String, Object> publishAccount, Long robotId) {
        Robot robot = robotService.requireOnline(robotId);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "publishAccountLogin");
        payload.put("requirement", "login");
        payload.put("commandType", "login");
        payload.put("publishAccountId", publishAccount.get("id"));
        payload.put("accountId", firstValue(publishAccount, "account_id", "accountId", "source_account_id", "base_account_id"));
        Object nickname = firstValue(publishAccount, "displayNickname", "nickname", "nick_name", "nick", "account_name", "name");
        payload.put("nickname", nickname);
        payload.put("displayNickname", nickname);
        payload.put("accountNickname", nickname);
        payload.put("robotId", robot.getId());
        payload.put("machineName", robot.getMachineName());
        payload.put("macAddress", robot.getMacAddress());
        payload.put("requestedAtMillis", System.currentTimeMillis());
        payload.put("publishAccount", withoutCookieFields(publishAccount));

        robotService.control(robot.getId(), RobotService.COMMAND_LOGIN, JSON.toJSONString(payload));
        return payload;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> startPublish(PublishAccountStartPublishRequest body) {
        List<Long> publishAccountIds = body == null || body.getPublishAccountIds() == null
                ? Collections.emptyList()
                : body.getPublishAccountIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (publishAccountIds.isEmpty()) {
            throw new BizException("请勾选发布账号");
        }

        Robot robot = robotService.requireOnline(body == null ? null : body.getRobotId());
        List<Map<String, Object>> publishAccounts = new ArrayList<>();
        for (Long publishAccountId : publishAccountIds) {
            Map<String, Object> publishAccount = loadPublishAccount(publishAccountId);
            if (publishAccount.isEmpty()) {
                throw new BizException("发布账号不存在或无权操作：" + publishAccountId);
            }
            publishAccounts.add(publishAccount);
        }

        Map<String, Map<String, Object>> baseAccounts = baseAccountMap(publishAccounts);
        Map<String, Queue<Map<String, Object>>> productsByCategory = pendingPublishProductsByCategory();
        Map<String, Map<String, Object>> configs = new HashMap<>();
        Set<String> usedProductIds = new HashSet<>();
        List<Map<String, Object>> accountTasks = new ArrayList<>();
        int totalProductCount = 0;

        for (Map<String, Object> publishAccount : publishAccounts) {
            Object accountId = firstValue(publishAccount, "account_id", "accountId", "source_account_id", "base_account_id");
            Map<String, Object> baseAccount = accountId == null ? null : baseAccounts.get(String.valueOf(accountId));
            int remainingPublishCount = remainingPublishCount(publishAccount, baseAccount);
            if (remainingPublishCount <= 0) {
                continue;
            }
            Object categoryId = firstNonEmpty(
                    baseAccount == null ? null : firstValue(baseAccount, "product_category_id", "productCategoryId"),
                    firstValue(publishAccount, "product_category_id", "productCategoryId", "category_ids", "categoryIds"));
            if (isEmpty(categoryId)) {
                continue;
            }
            Queue<Map<String, Object>> products = productsByCategory.get(String.valueOf(categoryId).trim());
            if (products == null || products.isEmpty()) {
                continue;
            }

            Object configId = firstValue(publishAccount, "config_id", "publish_config_id", "publish_config");
            Object configName = firstValue(publishAccount, "config_name", "publish_config_name", "displayConfigName");
            Map<String, Object> config = loadPublishConfigForAccount(configId, configName, configs);
            List<Map<String, Object>> publishProducts = new ArrayList<>();
            for (int i = 0; i < remainingPublishCount; i++) {
                Map<String, Object> product = pollUnusedProduct(products, usedProductIds);
                if (product == null) {
                    break;
                }
                Map<String, Object> productPayload = pendingPublishPayload(publishAccount, baseAccount, product, config);
                productPayload.put("publishAccountId", firstValue(publishAccount, "id"));
                Object productId = firstValue(productPayload, "productId", "product_id");
                Map<String, Object> publishRecord = publishRecordService.findOrCreate(
                        productId == null ? null : String.valueOf(productId),
                        longValue(firstValue(productPayload, "accountId", "account_id")));
                Object publishRecordId = firstValue(publishRecord, "id");
                productPayload.put("id", publishRecordId);
                productPayload.put("publishRecordId", publishRecordId);
                publishProducts.add(productPayload);
            }
            if (publishProducts.isEmpty()) {
                continue;
            }

            Map<String, Object> accountTask = new LinkedHashMap<>();
            accountTask.put("publishAccountId", firstValue(publishAccount, "id"));
            accountTask.put("accountId", accountId);
            accountTask.put("productCategoryId", categoryId);
            accountTask.put("productCategoryName", firstNonEmpty(
                    firstValue(baseAccount, "product_category_name", "productCategoryName"),
                    firstValue(publishAccount, "product_category_name", "productCategoryName", "displayCategoryNames")));
            accountTask.put("dailyMaxPublishCount", accountDailyMaxPublishCount(baseAccount));
            accountTask.put("publishConditionTotalNum", firstValue(publishAccount, "publishConditionTotalNum"));
            accountTask.put("publishConditions", publishAccount.get("publishConditions"));
            accountTask.put("todayPublishCount", intValue(firstValue(publishAccount, "todayPublishCount", "today_publish_count")));
            accountTask.put("remainingPublishCount", remainingPublishCount);
            accountTask.put("products", publishProducts);
            accountTask.put("account", withoutCookieFields(baseAccount));
            accountTask.put("publishAccount", withoutCookieFields(publishAccount));
            accountTasks.add(accountTask);
            totalProductCount += publishProducts.size();

            Map<String, Object> status = new LinkedHashMap<>();
            status.put("accountId", accountId);
            status.put("status", "正在发布");
            syncStatus(status);
        }

        if (totalProductCount <= 0) {
            throw new BizException("没有符合条件的待发布商品");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "startPublish");
        payload.put("requirement", "publish");
        payload.put("robotId", robot.getId());
        payload.put("machineName", robot.getMachineName());
        payload.put("macAddress", robot.getMacAddress());
        payload.put("publishAccountIds", publishAccountIds);
        payload.put("totalProductCount", totalProductCount);
        payload.put("requestedAtMillis", System.currentTimeMillis());
        payload.put("accounts", accountTasks);

        robotService.control(robot.getId(), RobotService.COMMAND_PUBLISH, JSON.toJSONString(payload));
        return payload;
    }

    public int incrementTodayPublishCount(Long accountId) {
        if (accountId == null) {
            throw new BizException("账号ID不能为空");
        }
        List<Map<String, Object>> columns = requireColumns();
        String accountColumn = firstExistingColumn(columns, "account_id", "source_account_id", "base_account_id");
        if (accountColumn == null) {
            accountColumn = hasColumn(columns, "id") ? "id" : null;
        }
        if (accountColumn == null) {
            throw new BizException("publish_account 缺少账号ID字段");
        }

        List<Object> args = new ArrayList<>();
        args.add(accountId);
        StringBuilder sql = new StringBuilder("select count(1) from ")
                .append(QUOTED_TABLE_NAME)
                .append(" where ")
                .append(quote(accountColumn))
                .append(" = ?");
        if (hasColumn(columns, "deleted")) {
            sql.append(" and `deleted` = 0");
        }
        if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
            sql.append(" and `tenant_id` = ?");
            args.add(TenantUtils.currentTenantId());
        }
        Number count = jdbcTemplate.queryForObject(sql.toString(), args.toArray(), Number.class);
        if (count == null || count.longValue() <= 0) {
            throw new BizException("账号ID对应的发布账号不存在或无权限");
        }
        return insertDailyPublishCount(accountId);
    }

    private int insertDailyPublishCount(Long accountId) {
        requireDailyPublishCountTable();
        List<String> columns = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        addDailyPublishInsertValue(columns, args, "day", currentDay());
        addDailyPublishInsertValue(columns, args, "account_id", accountId);
        addDailyPublishInsertValue(columns, args, "count", 1);
        String userId = currentUid();
        if (!isEmpty(userId) && tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "user_id")) {
            addDailyPublishInsertValue(columns, args, "user_id", userId);
        }
        if (tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "deleted")) {
            addDailyPublishInsertValue(columns, args, "deleted", 0);
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "tenant_id")) {
            addDailyPublishInsertValue(columns, args, "tenant_id", tenantId);
        }

        String columnSql = columns.stream().map(this::quote).collect(Collectors.joining(", "));
        String placeholderSql = columns.stream().map(column -> "?").collect(Collectors.joining(", "));
        StringJoiner duplicatePart = new StringJoiner(", ");
        duplicatePart.add("`count` = ifnull(`count`, 0) + 1");
        if (!isEmpty(userId) && tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "user_id")) {
            duplicatePart.add("`user_id` = values(`user_id`)");
        }
        if (tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "deleted")) {
            duplicatePart.add("`deleted` = 0");
        }
        if (tenantId != null && tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "tenant_id")) {
            duplicatePart.add("`tenant_id` = values(`tenant_id`)");
        }
        return jdbcTemplate.update("insert into " + QUOTED_DAILY_PUBLISH_COUNT_TABLE_NAME +
                " (" + columnSql + ") values (" + placeholderSql + ") on duplicate key update " + duplicatePart,
                args.toArray());
    }

    private void addDailyPublishInsertValue(List<String> columns, List<Object> args, String column, Object value) {
        if (tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, column)) {
            columns.add(column);
            args.add(value);
        }
    }

    private void requireDailyPublishCountTable() {
        if (!dailyPublishCountTableAvailable()) {
            throw new BizException("account_daily_publish_count 表缺少 day、account_id 或 count 字段");
        }
    }

    private boolean dailyPublishCountTableAvailable() {
        return tableExists(DAILY_PUBLISH_COUNT_TABLE_NAME)
                && tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "day")
                && tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "account_id")
                && tableHasColumn(DAILY_PUBLISH_COUNT_TABLE_NAME, "count");
    }

    private int currentDay() {
        return dayValue(LocalDate.now());
    }

    private int dayValue(LocalDate date) {
        return Integer.parseInt(date.format(DAY_FORMATTER));
    }

    public void startSelection(Map<String, Object> body) {
        Object publishAccountId = body == null ? null : firstNonEmpty(
                body.get("publishAccountId"),
                body.get("publish_account_id"),
                body.get("id"));
        if (isEmpty(publishAccountId)) {
            throw new BizException("无法启动选品：参数为空（publishAccountId）");
        }

        Map<String, Object> publishAccount = loadPublishAccount(publishAccountId);
        if (publishAccount.isEmpty()) {
            throw new BizException("发布账号不存在");
        }
        Object accountId = firstValue(publishAccount, "account_id", "accountId", "source_account_id", "base_account_id");
        if (isEmpty(accountId)) {
            throw new BizException("发布账号未关联基础账号");
        }
        Map<String, Object> account = loadBaseAccount(accountId);
        if (account.isEmpty()) {
            throw new BizException("关联账号不存在");
        }

        Object configId = firstValue(publishAccount, "config_id", "publish_config_id", "publish_config");
        Object configName = firstValue(publishAccount, "config_name", "publish_config_name");
        Map<String, Object> config = loadPublishConfig(configId, configName);
        if (config.isEmpty()) {
            throw new BizException("发布账号关联的发布配置不存在");
        }
        int todaySelectionCount = intValue(firstValue(publishAccount,
                "today_selection_count", "selection_count_today",
                "today_select_count", "today_product_count", "selection_count"));

        Object strategyId = firstValue(config, "selection_strategy_id", "selectionStrategyId", "strategy_id", "strategyId");
        Map<String, Object> selectionStrategy = loadSelectionStrategy(strategyId);
        if (selectionStrategy.isEmpty()) {
            throw new BizException("发布配置关联的选品策略不存在");
        }

        Map<String, Object> task = new LinkedHashMap<>();
        task.put("type", "startSelection");
        task.put("publishAccountId", publishAccountId);
        task.put("accountId", accountId);
        task.put("todaySelectionCount", todaySelectionCount);
        task.put("publishAccount", withoutCookieFields(publishAccount));
        task.put("account", withoutCookieFields(account));
        task.put("config", config);
        task.put("selectionStrategy", selectionStrategy);
        task.put("createTime", System.currentTimeMillis());
        PUBLISH_ACCOUNT_TASKS.add(task);

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("accountId", accountId);
        status.put("status", "正在选品");
        syncStatus(status);
    }

    public void collectCategories(Map<String, Object> body) {
        Object accountId = body == null ? null : firstNonEmpty(body.get("accountId"), body.get("account_id"));
        if (isEmpty(accountId)) {
            throw new BizException("无法采集品类：参数为空（accountId）");
        }
        Map<String, Object> task = new LinkedHashMap<>();
        task.put("type", "collectCategories");
        task.put("accountId", accountId);
        task.put("createTime", System.currentTimeMillis());
        PUBLISH_ACCOUNT_TASKS.add(task);
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("accountId", accountId);
        status.put("status", "正在采集品类");
        syncStatus(status);
    }

    public void stopCollectCategories(Map<String, Object> body) {
        Object accountId = body == null ? null : firstNonEmpty(body.get("accountId"), body.get("account_id"));
        if (isEmpty(accountId)) {
            throw new BizException("无法终止采集品类：参数为空（accountId）");
        }
        PUBLISH_ACCOUNT_TASKS.removeIf(task -> "collectCategories".equals(task.get("type"))
                && String.valueOf(accountId).equals(String.valueOf(task.get("accountId"))));
        Map<String, Object> task = new LinkedHashMap<>();
        task.put("type", "stopCollectCategories");
        task.put("accountId", accountId);
        task.put("createTime", System.currentTimeMillis());
        PUBLISH_ACCOUNT_TASKS.add(task);
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("accountId", accountId);
        status.put("status", "已登录");
        syncStatus(status);
    }

    public Map<String, Object> pollTask() {
        Map<String, Object> task = PUBLISH_ACCOUNT_TASKS.poll();
        return task == null ? Collections.emptyMap() : task;
    }

    @Transactional(rollbackFor = Exception.class)
    public List<Map<String, Object>> matchPendingPublishProducts() {
        return matchPendingPublishProducts(null);
    }

    @Transactional(rollbackFor = Exception.class)
    public List<Map<String, Object>> matchPendingPublishProducts(String macAddress) {
        Long robotId = robotIdByMacAddress(macAddress);
        if (robotId == null) {
            return Collections.emptyList();
        }
        String currentTime = LocalTime.now().withNano(0).format(TIME_FORMATTER);
        List<Map<String, Object>> accounts = loadAccountsInPublishTimeRange(currentTime, robotId);
        Map<String, Map<String, Object>> baseAccounts = baseAccountMap(accounts);
        Map<String, Queue<Map<String, Object>>> productsByCategory = pendingPublishProductsByCategory();
        Map<String, Map<String, Object>> configs = new HashMap<>();
        Set<String> usedProductIds = new HashSet<>();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> account : accounts) {
            Object accountId = firstValue(account, "account_id", "accountId", "source_account_id", "base_account_id");
            Map<String, Object> baseAccount = accountId == null ? null : baseAccounts.get(String.valueOf(accountId));
            int remainingPublishCount = remainingPublishCount(account, baseAccount);
            if (remainingPublishCount <= 0) {
                continue;
            }
            Object configId = firstValue(account, "config_id", "publish_config_id", "publish_config");
            Object configName = firstValue(account, "config_name", "publish_config_name", "displayConfigName");
            Map<String, Object> config = loadPublishConfigForAccount(configId, configName, configs);
            if (!publishIntervalReady(account, config)) {
                continue;
            }
            Object categoryId = firstNonEmpty(
                    baseAccount == null ? null : firstValue(baseAccount, "product_category_id", "productCategoryId"),
                    firstValue(account, "product_category_id", "productCategoryId", "category_ids", "categoryIds"));
            if (isEmpty(categoryId)) {
                continue;
            }
            Queue<Map<String, Object>> products = productsByCategory.get(String.valueOf(categoryId).trim());
            if (products == null || products.isEmpty()) {
                continue;
            }
            Map<String, Object> product = pollUnusedProduct(products, usedProductIds);
            if (product != null) {
                Map<String, Object> payload = pendingPublishPayload(account, baseAccount, product, config);
                payload.put("publishAccountId", firstValue(account, "id"));
                Object productId = firstValue(payload, "productId", "product_id");
                Map<String, Object> publishRecord = publishRecordService.findOrCreate(
                        productId == null ? null : String.valueOf(productId),
                        longValue(firstValue(payload, "accountId", "account_id")));
                Object publishRecordId = firstValue(publishRecord, "id");
                payload.put("id", publishRecordId);
                payload.put("publishRecordId", publishRecordId);
                result.add(payload);
            }
        }
        return result;
    }

    private boolean publishIntervalReady(Map<String, Object> publishAccount, Map<String, Object> config) {
        int publishInterval = intValue(firstValue(config, "publish_interval", "publishInterval"));
        if (publishInterval <= 0) {
            return true;
        }
        Long accountId = longValue(firstValue(publishAccount, "account_id", "accountId", "source_account_id", "base_account_id"));
        if (accountId == null
                || !tableExists("publish_record")
                || !tableHasColumn("publish_record", "account_id")
                || !tableHasColumn("publish_record", "status")
                || !tableHasColumn("publish_record", "update_time")) {
            return true;
        }

        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("`account_id` = ?");
        args.add(accountId);
        clauses.add("`status` = ?");
        args.add("发布成功");
        clauses.add("`update_time` is not null");
        clauses.add("`update_time` > ?");
        args.add(LocalDateTime.now().minusMinutes(publishInterval));
        appendPublishRecordFilters(clauses, args);

        Number count = jdbcTemplate.queryForObject("select count(1) from `publish_record` where " +
                        String.join(" and ", clauses),
                args.toArray(), Number.class);
        return count == null || count.longValue() <= 0;
    }

    private Long robotIdByMacAddress(String macAddress) {
        if (isEmpty(macAddress)
                || !tableExists("robot")
                || !tableHasColumn("robot", "id")
                || !tableHasColumn("robot", "mac_address")) {
            return null;
        }
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("lower(`mac_address`) = ?");
        args.add(macAddress.trim().toLowerCase());
        if (tableHasColumn("robot", "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("robot", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select `id` from `robot` where " + String.join(" and ", clauses) + " order by `id` desc limit 1",
                args.toArray());
        if (rows.isEmpty()) {
            return null;
        }
        return longValue(firstValue(rows.get(0), "id"));
    }

    private Map<String, Object> pendingPublishPayload(Map<String, Object> publishAccount,
                                                      Map<String, Object> baseAccount,
                                                      Map<String, Object> product,
                                                      Map<String, Object> config) {
        Map<String, Object> options = publishOptions(config);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("accountId", firstValue(publishAccount, "account_id", "accountId", "source_account_id", "base_account_id"));
        Object nickname = firstNonEmpty(
                firstValue(publishAccount, "displayNickname", "nickname", "nick_name", "nick", "account_name", "name"),
                baseAccount == null ? null : firstValue(baseAccount, "nickname", "nick_name", "nick", "account_name", "name"));
        payload.put("nickname", nickname);
        payload.put("displayNickname", nickname);
        payload.put("accountNickname", nickname);
        payload.put("userId", firstNonEmpty(
                firstValue(publishAccount, "user_id", "userId"),
                baseAccount == null ? null : firstValue(baseAccount, "user_id", "userId"),
                firstValue(config, "user_id", "userId")));
        payload.put("clipConfigId", firstValue(config, "clip_config_id", "clipConfigId"));
        payload.put("productId", firstValue(product, "productId", "product_id"));
        payload.put("productTitle", firstValue(product, "productTitle", "product_title"));
        payload.put("productContent", firstNonEmpty(firstValue(product, "productContent", "product_content"), ""));
        payload.put("productLink", firstNonEmpty(firstValue(product, "productLink", "product_link"), ""));
        payload.put("createTime", firstValue(product, "createTime", "create_time", "clipCreateTime", "clip_create_time"));
        Object publishDir = firstNonEmpty(
                firstValue(config, "publish_dir", "publishDir"),
                firstValue(product, "publishDir", "publish_dir"));
        payload.put("publishDir", firstNonEmpty(publishDir, ""));
        payload.put("isCarrier", firstValue(config, "is_carrier", "isCarrier"));
        payload.put("selfDeclaration", firstNonEmpty(
                firstValue(options, "self_declaration", "selfDeclaration"),
                "无需添加自主声明"));
        payload.put("syncPublish", firstNonEmpty(
                firstValue(options, "sync_publish", "syncPublish"),
                "不同时发布"));
        payload.put("visibility", firstNonEmpty(
                firstValue(options, "visibility"),
                "公开"));
        payload.put("savePermission", firstNonEmpty(
                firstValue(options, "save_permission", "savePermission"),
                "允许"));
        payload.put("publishTime", firstNonEmpty(
                firstValue(options, "publish_time", "publishTime"),
                "立即发布"));
        Object publishDelay = firstNonEmpty(
                firstValue(config, "publish_delay", "publishDelay"),
                firstValue(options, "publish_delay", "publishDelay"),
                30);
        payload.put("publishDelay", publishDelay);
        payload.put("publishInterval", firstNonEmpty(
                firstValue(config, "publish_interval", "publishInterval"),
                firstValue(options, "publish_interval", "publishInterval"),
                0));
        return payload;
    }

    private Map<String, Object> withoutCookieFields(Map<String, Object> source) {
        if (source == null) {
            return null;
        }
        Map<String, Object> copy = new LinkedHashMap<>(source);
        copy.keySet().removeIf(key -> {
            String normalized = key == null ? "" : key.replace("_", "").toLowerCase();
            return "creatorcookie".equals(normalized) || "cookie".equals(normalized) || "cookies".equals(normalized);
        });
        return copy;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> publishOptions(Map<String, Object> config) {
        Map<String, Object> options = new LinkedHashMap<>();
        if (config == null || config.isEmpty()) {
            return options;
        }
        Object raw = firstValue(config, "publish_options", "publishOptions");
        if (!isEmpty(raw)) {
            if (raw instanceof Map) {
                options.putAll((Map<String, Object>) raw);
            } else {
                try {
                    options.putAll(JSON.parseObject(String.valueOf(raw), LinkedHashMap.class));
                } catch (Exception ignored) {
                    // Fall back to the separate publish_config columns below.
                }
            }
        }
        putIfNotEmpty(options, "self_declaration", firstValue(config, "self_declaration", "selfDeclaration"));
        putIfNotEmpty(options, "sync_publish", firstValue(config, "sync_publish", "syncPublish"));
        putIfNotEmpty(options, "visibility", firstValue(config, "visibility"));
        putIfNotEmpty(options, "save_permission", firstValue(config, "save_permission", "savePermission"));
        putIfNotEmpty(options, "publish_time", firstValue(config, "publish_time", "publishTime"));
        return options;
    }

    private void putIfNotEmpty(Map<String, Object> target, String key, Object value) {
        if (!isEmpty(value)) {
            target.put(key, value);
        }
    }

    private Map<String, Object> loadPublishConfigForAccount(Object configId, Object configName,
                                                            Map<String, Map<String, Object>> cache) {
        if (isEmpty(configId) && isEmpty(configName)) {
            return Collections.emptyMap();
        }
        String key = !isEmpty(configId) ? "id:" + String.valueOf(configId) : "name:" + String.valueOf(configName);
        if (cache.containsKey(key)) {
            return cache.get(key);
        }
        Map<String, Object> config = loadPublishConfig(configId, configName);
        cache.put(key, config);
        return config;
    }

    private List<Map<String, Object>> loadAccountsInPublishTimeRange(String currentTime) {
        return loadAccountsInPublishTimeRange(currentTime, null);
    }

    private List<Map<String, Object>> loadAccountsInPublishTimeRange(String currentTime, Long robotId) {
        List<Map<String, Object>> columns = requireColumns();
        if (!hasColumn(columns, "id")
                || firstExistingColumn(columns, "account_id", "source_account_id", "base_account_id") == null
                || robotId == null
                || !hasColumn(columns, "robot_id")
                || !tableExists(PUBLISH_CONDITION_TABLE_NAME)
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_account_id")
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_time_range_begin")
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_time_range_end")
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_num")) {
            return Collections.emptyList();
        }

        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        if (hasColumn(columns, "deleted")) {
            clauses.add("pa.`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn(columns, "tenant_id")) {
            clauses.add("pa.`tenant_id` = ?");
            args.add(tenantId);
        }
        clauses.add("pa.`robot_id` = ?");
        args.add(robotId);
        List<Object> activeConditionArgs = new ArrayList<>();
        String activeConditionSql = activePublishConditionExistsSql(currentTime, tenantId, activeConditionArgs);
        clauses.add(activeConditionSql);
        args.addAll(activeConditionArgs);

        String order = hasColumn(columns, "id") ? " order by pa.`id` asc" : "";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select pa.* from " + QUOTED_TABLE_NAME + " pa" +
                        " where " + String.join(" and ", clauses) + order,
                args.toArray());
        enrichRows(rows);
        applyCurrentPublishConditionLimit(rows, currentTime);
        rows.sort((left, right) -> {
            int countCompare = Integer.compare(
                    intValue(firstValue(left, "todayPublishCount")),
                    intValue(firstValue(right, "todayPublishCount")));
            if (countCompare != 0) {
                return countCompare;
            }
            Long leftId = longValue(firstValue(left, "id"));
            Long rightId = longValue(firstValue(right, "id"));
            return Long.compare(leftId == null ? 0 : leftId, rightId == null ? 0 : rightId);
        });
        return rows;
    }

    private String activePublishConditionExistsSql(String currentTime, Long tenantId, List<Object> args) {
        StringBuilder sql = new StringBuilder("exists (select 1 from ")
                .append(QUOTED_PUBLISH_CONDITION_TABLE_NAME)
                .append(" pc where cast(pc.`publish_account_id` as unsigned) = pa.`id`")
                .append(" and pc.`publish_time_range_begin` is not null")
                .append(" and pc.`publish_time_range_end` is not null")
                .append(" and ifnull(pc.`publish_num`, 0) > 0")
                .append(" and time(?) >= pc.`publish_time_range_begin`")
                .append(" and time(?) < pc.`publish_time_range_end`");
        args.add(currentTime);
        args.add(currentTime);
        if (tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "deleted")) {
            sql.append(" and ifnull(pc.`deleted`, 0) = 0");
        }
        if (tenantId != null && tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "tenant_id")) {
            sql.append(" and pc.`tenant_id` = ?");
            args.add(tenantId);
        }
        sql.append(")");
        return sql.toString();
    }

    @SuppressWarnings("unchecked")
    private void applyCurrentPublishConditionLimit(List<Map<String, Object>> rows, String currentTime) {
        Integer currentMinutes = timeMinutes(currentTime);
        if (rows == null || rows.isEmpty() || currentMinutes == null) {
            return;
        }
        for (Map<String, Object> row : rows) {
            Object rawConditions = row.get("publishConditions");
            if (!(rawConditions instanceof List)) {
                continue;
            }
            List<Map<String, Object>> conditions = (List<Map<String, Object>>) rawConditions;
            int currentConditionNum = 0;
            int publishedCount = 0;
            Object currentConditionId = null;
            Object currentConditionBegin = null;
            Object currentConditionEnd = null;
            for (Map<String, Object> condition : conditions) {
                Object begin = firstValue(condition, "publish_time_range_begin", "publishTimeRangeBegin");
                Object end = firstValue(condition, "publish_time_range_end", "publishTimeRangeEnd");
                Integer beginMinutes = timeMinutes(begin);
                Integer endMinutes = timeMinutes(end);
                int publishNum = intValue(firstValue(condition, "publish_num", "publishNum"));
                if (beginMinutes == null || endMinutes == null || publishNum <= 0) {
                    continue;
                }
                if (beginMinutes <= currentMinutes && currentMinutes < endMinutes) {
                    currentConditionNum += publishNum;
                    publishedCount += currentPublishConditionPublishedCount(row, begin, end);
                    currentConditionId = firstValue(condition, "id");
                    currentConditionBegin = begin;
                    currentConditionEnd = end;
                }
            }
            row.put("currentPublishConditionNum", currentConditionNum);
            row.put("currentPublishConditionId", currentConditionId);
            row.put("currentPublishConditionBegin", currentConditionBegin);
            row.put("currentPublishConditionEnd", currentConditionEnd);
            row.put("publishConditionAllowedCount", currentConditionNum);
            row.put("publishConditionPublishedCount", publishedCount);
            row.put("publishConditionRemainingCount", Math.max(currentConditionNum - publishedCount, 0));
        }
    }

    private int currentPublishConditionPublishedCount(Map<String, Object> publishAccount, Object begin, Object end) {
        Long accountId = longValue(firstValue(publishAccount, "account_id", "accountId", "source_account_id", "base_account_id"));
        if (accountId == null || isEmpty(begin) || isEmpty(end)
                || !tableExists("publish_record")
                || !tableHasColumn("publish_record", "account_id")
                || !tableHasColumn("publish_record", "status")) {
            return 0;
        }
        boolean hasPublishTime = tableHasColumn("publish_record", "publish_time");
        boolean hasCreateTime = tableHasColumn("publish_record", "create_time");
        if (!hasPublishTime && !hasCreateTime) {
            return intValue(firstValue(publishAccount, "todayPublishCount", "today_publish_count"));
        }

        String timeExpression = publishRecordTimeExpression(hasPublishTime, hasCreateTime);
        LocalDate today = LocalDate.now();
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("`account_id` = ?");
        args.add(accountId);
        clauses.add("`status` = ?");
        args.add("发布成功");
        clauses.add(timeExpression + " >= ?");
        args.add(today.atStartOfDay());
        clauses.add(timeExpression + " < ?");
        args.add(today.plusDays(1).atStartOfDay());
        clauses.add("time(" + timeExpression + ") >= time(?)");
        args.add(normalizeTimeForSql(begin));
        clauses.add("time(" + timeExpression + ") < time(?)");
        args.add(normalizeTimeForSql(end));
        appendPublishRecordFilters(clauses, args);
        Number count = jdbcTemplate.queryForObject("select count(1) from `publish_record` where " +
                        String.join(" and ", clauses),
                args.toArray(), Number.class);
        return count == null ? 0 : count.intValue();
    }

    private Map<String, Queue<Map<String, Object>>> pendingPublishProductsByCategory() {
        if (!tableExists("clip_record")
                || !tableExists("product_selection_records")
                || !tableHasColumn("clip_record", "id")
                || !tableHasColumn("clip_record", "product_id")
                || !tableHasColumn("product_selection_records", "id")
                || !tableHasColumn("product_selection_records", "product_id")
                || !tableHasColumn("product_selection_records", "product_category_id")
                || !tableHasColumn("product_selection_records", "status")) {
            return Collections.emptyMap();
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
                .append("join `product_selection_records` psr on psr.`id` = latest_psr.`id`")
                .append(productCategoryJoinSql("psr"));

        List<Object> args = new ArrayList<>(latestSelectionArgs);
        List<String> clauses = new ArrayList<>();
        clauses.add("psr.`status` = ?");
        args.add(STATUS_PENDING_PUBLISH);
        clauses.add("psr.`product_category_id` is not null");
        appendNotInPublishRecordClause(clauses, args, tenantId);
        if (tableHasColumn("clip_record", "deleted")) {
            clauses.add("ifnull(cr.`deleted`, 0) = 0");
        }
        if (tenantId != null && tableHasColumn("clip_record", "tenant_id")) {
            clauses.add("cr.`tenant_id` = ?");
            args.add(tenantId);
        }

        String productTitleSelect = tableHasColumn("product_selection_records", "product_title")
                ? "psr.`product_title`"
                : "null";
        String productContentSelect = firstExistingTableColumn("product_selection_records",
                "product_content", "content", "product_desc", "product_description", "description", "remark");
        String productLinkSelect = firstExistingTableColumn("product_selection_records",
                "product_link", "trailer_link", "goods_link", "item_link", "product_url", "url");
        String publishDirSelect = firstExistingTableColumn("clip_record",
                "publish_dict", "publishDict", "publish_dir", "publish_directory",
                "output_dir", "output_directory", "output_path", "output_paths",
                "video_path", "video_file_path", "file_path");
        String categoryNameSelect = canJoinProductCategory() ? "pc.`name`" : "null";
        String clipCreateTimeSelect = tableHasColumn("clip_record", "create_time")
                ? "cr.`create_time`"
                : "null";
        String orderSql = tableHasColumn("clip_record", "create_time")
                ? " order by cr.`create_time` asc, cr.`id` asc"
                : " order by cr.`id` asc";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select cr.`id` as `clip_record_id`, " +
                        clipCreateTimeSelect + " as `clip_create_time`, " +
                        "psr.`id` as `selection_record_id`, " +
                        "psr.`product_id`, " +
                        productTitleSelect + " as `product_title`, " +
                        selectExpression("psr", productContentSelect) + " as `product_content`, " +
                        selectExpression("psr", productLinkSelect) + " as `product_link`, " +
                        selectExpression("cr", publishDirSelect) + " as `publish_dir`, " +
                        "psr.`product_category_id`, " +
                        categoryNameSelect + " as `product_category_name`" +
                        fromSql +
                        " where " + String.join(" and ", clauses) +
                        orderSql,
                args.toArray());

        Map<String, Queue<Map<String, Object>>> productsByCategory = new LinkedHashMap<>();
        Set<String> seenProductIds = new HashSet<>();
        for (Map<String, Object> row : rows) {
            Object productId = firstValue(row, "product_id", "productId");
            Object categoryId = firstValue(row, "product_category_id", "productCategoryId");
            if (isEmpty(productId) || isEmpty(categoryId)) {
                continue;
            }
            String productKey = String.valueOf(productId).trim();
            if (!seenProductIds.add(productKey)) {
                continue;
            }

            Map<String, Object> product = new LinkedHashMap<>();
            product.put("clipRecordId", firstValue(row, "clip_record_id", "clipRecordId"));
            product.put("clipCreateTime", firstValue(row, "clip_create_time", "clipCreateTime"));
            product.put("selectionRecordId", firstValue(row, "selection_record_id", "selectionRecordId"));
            product.put("productId", productId);
            product.put("productTitle", firstValue(row, "product_title", "productTitle"));
            product.put("productContent", firstValue(row, "product_content", "productContent"));
            product.put("productLink", firstValue(row, "product_link", "productLink"));
            product.put("publishDir", firstValue(row, "publish_dir", "publishDir"));
            product.put("createTime", firstValue(row, "clip_create_time", "clipCreateTime"));
            product.put("productCategoryId", categoryId);
            product.put("productCategoryName", firstValue(row, "product_category_name", "productCategoryName"));
            productsByCategory
                    .computeIfAbsent(String.valueOf(categoryId).trim(), key -> new ConcurrentLinkedQueue<>())
                    .add(product);
        }
        return productsByCategory;
    }

    private void appendNotInPublishRecordClause(List<String> clauses, List<Object> args, Long tenantId) {
        if (!tableExists("publish_record") || !tableHasColumn("publish_record", "product_id")) {
            return;
        }
        StringBuilder sql = new StringBuilder("not exists (select 1 from `publish_record` pr where pr.`product_id` = psr.`product_id`");
        if (tableHasColumn("publish_record", "deleted")) {
            sql.append(" and ifnull(pr.`deleted`, 0) = 0");
        }
        if (tenantId != null && tableHasColumn("publish_record", "tenant_id")) {
            sql.append(" and pr.`tenant_id` = ?");
            args.add(tenantId);
        }
        sql.append(")");
        clauses.add(sql.toString());
    }

    private String firstExistingTableColumn(String tableName, String... names) {
        for (String name : names) {
            if (tableHasColumn(tableName, name)) {
                return name;
            }
        }
        return null;
    }

    private String selectExpression(String alias, String column) {
        return column == null ? "null" : alias + ".`" + column.replace("`", "``") + "`";
    }

    private Map<String, Object> pollUnusedProduct(Queue<Map<String, Object>> products, Set<String> usedProductIds) {
        if (products == null) {
            return null;
        }
        while (!products.isEmpty()) {
            Map<String, Object> product = products.poll();
            Object productId = firstValue(product, "productId", "product_id");
            if (isEmpty(productId)) {
                continue;
            }
            if (usedProductIds.add(String.valueOf(productId).trim())) {
                return product;
            }
        }
        return null;
    }

    private boolean canJoinProductCategory() {
        return tableExists("product_category")
                && tableHasColumn("product_category", "id")
                && tableHasColumn("product_category", "name")
                && tableHasColumn("product_selection_records", "product_category_id");
    }

    private String productCategoryJoinSql(String selectionAlias) {
        if (!canJoinProductCategory()) {
            return "";
        }
        StringBuilder sql = new StringBuilder(" left join `product_category` pc on pc.`id` = ")
                .append(selectionAlias)
                .append(".`product_category_id`");
        if (tableHasColumn("product_category", "deleted")) {
            sql.append(" and ifnull(pc.`deleted`, 0) = 0");
        }
        if (tableHasColumn("product_category", "tenant_id")
                && tableHasColumn("product_selection_records", "tenant_id")) {
            sql.append(" and pc.`tenant_id` = ")
                    .append(selectionAlias)
                    .append(".`tenant_id`");
        }
        return sql.toString();
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Map<String, Object> body) {
        List<Map<String, Object>> columns = requireColumns();
        Object id = body == null ? null : body.get("id");
        if (isEmpty(id)) {
            throw new BizException("无法删除发布账号：参数为空（id）");
        }
        deletePublishConditions(id);
        if (hasColumn(columns, "deleted")) {
            List<Object> args = new ArrayList<>();
            args.add(id);
            String tenantWhere = "";
            if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
                tenantWhere = " and `tenant_id` = ?";
                args.add(TenantUtils.currentTenantId());
            }
            jdbcTemplate.update("update " + QUOTED_TABLE_NAME + " set `deleted` = 1 where `id` = ?" + tenantWhere,
                    args.toArray());
        } else {
            List<Object> args = new ArrayList<>();
            args.add(id);
            String tenantWhere = "";
            if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
                tenantWhere = " and `tenant_id` = ?";
                args.add(TenantUtils.currentTenantId());
            }
            jdbcTemplate.update("delete from " + QUOTED_TABLE_NAME + " where `id` = ?" + tenantWhere,
                    args.toArray());
        }
    }

    private void deletePublishConditions(Object publishAccountId) {
        if (isEmpty(publishAccountId) || !tableExists(PUBLISH_CONDITION_TABLE_NAME)
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_account_id")) {
            return;
        }
        List<Object> args = new ArrayList<>();
        args.add(String.valueOf(publishAccountId));
        String tenantWhere = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "tenant_id")) {
            tenantWhere = " and `tenant_id` = ?";
            args.add(tenantId);
        }
        if (tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "deleted")) {
            jdbcTemplate.update("update " + QUOTED_PUBLISH_CONDITION_TABLE_NAME +
                    " set `deleted` = 1 where `publish_account_id` = ?" + tenantWhere,
                    args.toArray());
        } else {
            jdbcTemplate.update("delete from " + QUOTED_PUBLISH_CONDITION_TABLE_NAME +
                    " where `publish_account_id` = ?" + tenantWhere,
                    args.toArray());
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public int importFromAccounts(Map<String, Object> body) {
        boolean hasPublishConditions = hasPublishConditionsPayload(body);
        List<Map<String, Object>> publishConditions = hasPublishConditions
                ? normalizePublishConditions(body)
                : Collections.emptyList();
        List<Object> accountIds = extractIds(body == null ? null : body.get("accountIds"));
        if (accountIds.isEmpty() && body != null) {
            Object accountId = body.get("accountId");
            if (!isEmpty(accountId)) {
                accountIds.add(accountId);
            }
        }
        if (accountIds.isEmpty()) {
            throw new BizException("请选择要导入的账号");
        }

        Object configId = body == null ? null : firstNonEmpty(body.get("configId"), body.get("publishConfigId"));
        Object configName = body == null ? null : firstNonEmpty(body.get("configName"), body.get("publishConfigName"));
        Object robotId = body == null ? null : firstNonEmpty(body.get("robotId"), body.get("robot_id"));
        if (isEmpty(configId) && isEmpty(configName)) {
            throw new BizException("请选择发布配置");
        }
        List<Map<String, Object>> columns = requireColumns();
        List<Map<String, Object>> accounts = loadBaseAccounts(accountIds);
        Map<String, Object> config = loadPublishConfig(configId, configName);
        if (config.isEmpty()) {
            throw new BizException("发布配置不存在");
        }
        updatePublishConfigSelectionAudit(body);
        int count = 0;
        for (Map<String, Object> account : accounts) {
            LinkedHashMap<String, Object> values = valuesFromAccount(
                    account, config, robotId, columns);
            if (values.isEmpty()) {
                continue;
            }
            Object publishAccountId = insertValues(values);
            if (hasPublishConditions) {
                replacePublishConditions(publishAccountId, publishConditions);
            }
            count++;
        }
        return count;
    }

    private Map<String, Object> loadPublishAccount(Object publishAccountId) {
        if (!tableExists(TABLE_NAME) || !tableHasColumn(TABLE_NAME, "id")) {
            return Collections.emptyMap();
        }
        List<Object> args = new ArrayList<>();
        args.add(publishAccountId);
        List<String> clauses = new ArrayList<>();
        clauses.add("`id` = ?");
        if (tableHasColumn(TABLE_NAME, "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn(TABLE_NAME, "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select * from " + QUOTED_TABLE_NAME + " where " + String.join(" and ", clauses) + " limit 1",
                args.toArray());
        if (rows.isEmpty()) {
            return Collections.emptyMap();
        }
        enrichRows(rows);
        return rows.get(0);
    }

    private Map<String, Object> loadPublishAccountByAccountId(Object accountId) {
        if (isEmpty(accountId) || !tableExists(TABLE_NAME)) {
            return Collections.emptyMap();
        }
        List<Map<String, Object>> columns = columns();
        String accountColumn = firstExistingColumn(columns, "account_id", "source_account_id", "base_account_id");
        if (accountColumn == null) {
            return Collections.emptyMap();
        }
        List<Object> args = new ArrayList<>();
        args.add(accountId);
        List<String> clauses = new ArrayList<>();
        clauses.add(quote(accountColumn) + " = ?");
        if (hasColumn(columns, "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn(columns, "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select * from " + QUOTED_TABLE_NAME + " where " + String.join(" and ", clauses) + " order by `id` desc limit 1",
                args.toArray());
        if (rows.isEmpty()) {
            return Collections.emptyMap();
        }
        enrichRows(rows);
        return rows.get(0);
    }

    private Map<String, Object> loadBaseAccount(Object accountId) {
        if (isEmpty(accountId) || !tableExists("account") || !tableHasColumn("account", "id")) {
            return Collections.emptyMap();
        }
        List<Object> args = new ArrayList<>();
        args.add(accountId);
        List<String> clauses = new ArrayList<>();
        clauses.add("`id` = ?");
        if (tableHasColumn("account", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("account", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select * from `account` where " + String.join(" and ", clauses) + " limit 1",
                args.toArray());
        fillAccountCategoryNames(rows);
        fillAccountProxy(rows);
        return rows.isEmpty() ? Collections.emptyMap() : rows.get(0);
    }

    private int intValue(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return (int) Double.parseDouble(String.valueOf(value).trim());
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return null;
        }
        try {
            return Long.valueOf(text);
        } catch (NumberFormatException ignored) {
            try {
                return (long) Double.parseDouble(text);
            } catch (NumberFormatException ignoredAgain) {
                return null;
            }
        }
    }

    private void validatePublishTimeRange(Map<String, Object> body) {
        if (body == null) {
            return;
        }
        Object begin = firstValue(body, "publish_time_range_begin", "publishTimeRangeBegin");
        Object end = firstValue(body, "publish_time_range_end", "publishTimeRangeEnd");
        if (!isAllowedHalfHourTime(begin) || !isAllowedHalfHourTime(end)) {
            throw new BizException("发布时间分钟只能选择00或30");
        }
        Integer beginMinutes = timeMinutes(begin);
        Integer endMinutes = timeMinutes(end);
        if (beginMinutes != null && endMinutes != null && beginMinutes >= endMinutes) {
            throw new BizException("发布时间开始必须小于发布时间结束");
        }
    }

    private boolean isAllowedHalfHourTime(Object value) {
        if (isEmpty(value)) {
            return true;
        }
        String text = String.valueOf(value).trim();
        return text.matches("^([01]\\d|2[0-3]):(00|30)(:00)?$");
    }

    private Integer timeMinutes(Object value) {
        if (isEmpty(value)) {
            return null;
        }
        String[] parts = String.valueOf(value).trim().split(":");
        if (parts.length < 2) {
            return null;
        }
        try {
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            return hour * 60 + minute;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private boolean hasPublishConditionsPayload(Map<String, Object> body) {
        return body != null && (body.containsKey("publishConditions")
                || body.containsKey("publish_conditions")
                || body.containsKey("conditions"));
    }

    private Object publishConditionsRaw(Map<String, Object> body) {
        if (body == null) {
            return null;
        }
        if (body.containsKey("publishConditions")) {
            return body.get("publishConditions");
        }
        if (body.containsKey("publish_conditions")) {
            return body.get("publish_conditions");
        }
        return body.get("conditions");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> normalizePublishConditions(Map<String, Object> body) {
        Object raw = publishConditionsRaw(body);
        List<Map<String, Object>> sourceRows = new ArrayList<>();
        if (raw == null) {
            return sourceRows;
        }
        if (raw instanceof Iterable) {
            for (Object item : (Iterable<?>) raw) {
                if (!(item instanceof Map)) {
                    throw new BizException("发布条件格式不正确");
                }
                sourceRows.add((Map<String, Object>) item);
            }
        } else if (raw instanceof String && !String.valueOf(raw).trim().isEmpty()) {
            List<LinkedHashMap> parsedRows = JSON.parseArray(String.valueOf(raw), LinkedHashMap.class);
            for (Object item : parsedRows) {
                if (!(item instanceof Map)) {
                    throw new BizException("发布条件格式不正确");
                }
                sourceRows.add((Map<String, Object>) item);
            }
        } else {
            throw new BizException("发布条件格式不正确");
        }

        List<Map<String, Object>> normalizedRows = new ArrayList<>();
        int totalPublishNum = 0;
        for (Map<String, Object> row : sourceRows) {
            Object begin = firstValue(row, "publish_time_range_begin", "publishTimeRangeBegin", "begin", "start");
            Object end = firstValue(row, "publish_time_range_end", "publishTimeRangeEnd", "end");
            Object publishNumValue = firstValue(row, "publish_num", "publishNum");
            if (isEmpty(begin) || isEmpty(end) || isEmpty(publishNumValue)) {
                throw new BizException("请完善发布条件");
            }
            if (!isAllowedHalfHourTime(begin) || !isAllowedHalfHourTime(end)) {
                throw new BizException("发布时间分钟只能选择00或30");
            }
            Integer beginMinutes = timeMinutes(begin);
            Integer endMinutes = timeMinutes(end);
            if (beginMinutes == null || endMinutes == null || beginMinutes >= endMinutes) {
                throw new BizException("发布时间开始必须小于发布时间结束");
            }
            int publishNum = intValue(publishNumValue);
            if (publishNum <= 0) {
                throw new BizException("发布数量必须大于0");
            }
            totalPublishNum += publishNum;
            if (totalPublishNum > 10) {
                throw new BizException("发布数量合计不能超过10");
            }

            Map<String, Object> normalized = new LinkedHashMap<>();
            normalized.put("publish_time_range_begin", normalizeTimeForSql(begin));
            normalized.put("publish_time_range_end", normalizeTimeForSql(end));
            normalized.put("publish_num", publishNum);
            normalized.put("beginMinutes", beginMinutes);
            normalized.put("endMinutes", endMinutes);
            normalizedRows.add(normalized);
        }

        normalizedRows.sort((left, right) -> Integer.compare(
                intValue(left.get("beginMinutes")),
                intValue(right.get("beginMinutes"))));
        for (int i = 1; i < normalizedRows.size(); i++) {
            int previousEnd = intValue(normalizedRows.get(i - 1).get("endMinutes"));
            int currentBegin = intValue(normalizedRows.get(i).get("beginMinutes"));
            if (currentBegin < previousEnd) {
                throw new BizException("发布时间范围不能重叠");
            }
        }
        for (Map<String, Object> row : normalizedRows) {
            row.remove("beginMinutes");
            row.remove("endMinutes");
        }
        return normalizedRows;
    }

    private String normalizeTimeForSql(Object value) {
        if (isEmpty(value)) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.length() == 5 ? text + ":00" : text;
    }

    private void replacePublishConditions(Object publishAccountId, List<Map<String, Object>> publishConditions) {
        if (isEmpty(publishAccountId)) {
            throw new BizException("发布账号ID不能为空");
        }
        requirePublishConditionTable();
        List<Object> deleteArgs = new ArrayList<>();
        deleteArgs.add(String.valueOf(publishAccountId));
        String tenantWhere = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "tenant_id")) {
            tenantWhere = " and `tenant_id` = ?";
            deleteArgs.add(tenantId);
        }
        if (tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "deleted")) {
            jdbcTemplate.update("update " + QUOTED_PUBLISH_CONDITION_TABLE_NAME +
                    " set `deleted` = 1 where `publish_account_id` = ?" + tenantWhere,
                    deleteArgs.toArray());
        } else {
            jdbcTemplate.update("delete from " + QUOTED_PUBLISH_CONDITION_TABLE_NAME +
                    " where `publish_account_id` = ?" + tenantWhere,
                    deleteArgs.toArray());
        }

        for (Map<String, Object> condition : publishConditions) {
            List<String> columns = new ArrayList<>();
            List<Object> args = new ArrayList<>();
            addPublishConditionInsertValue(columns, args, "publish_account_id", String.valueOf(publishAccountId));
            addPublishConditionInsertValue(columns, args, "publish_time_range_begin", condition.get("publish_time_range_begin"));
            addPublishConditionInsertValue(columns, args, "publish_time_range_end", condition.get("publish_time_range_end"));
            addPublishConditionInsertValue(columns, args, "publish_num", condition.get("publish_num"));
            if (tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "deleted")) {
                addPublishConditionInsertValue(columns, args, "deleted", 0);
            }
            if (tenantId != null && tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "tenant_id")) {
                addPublishConditionInsertValue(columns, args, "tenant_id", tenantId);
            }
            String columnSql = columns.stream().map(this::quote).collect(Collectors.joining(", "));
            String placeholderSql = columns.stream().map(column -> "?").collect(Collectors.joining(", "));
            jdbcTemplate.update("insert into " + QUOTED_PUBLISH_CONDITION_TABLE_NAME +
                    " (" + columnSql + ") values (" + placeholderSql + ")", args.toArray());
        }
    }

    private void addPublishConditionInsertValue(List<String> columns, List<Object> args, String column, Object value) {
        if (tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, column)) {
            columns.add(column);
            args.add(value);
        }
    }

    private void requirePublishConditionTable() {
        if (!tableExists(PUBLISH_CONDITION_TABLE_NAME)
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_account_id")
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_time_range_begin")
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_time_range_end")
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_num")) {
            throw new BizException("publish_condition 表结构不完整");
        }
    }

    private String whereSql(List<Map<String, Object>> columns, List<Object> args) {
        List<String> clauses = new ArrayList<>();
        if (hasColumn(columns, "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && hasColumn(columns, "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        return clauses.isEmpty() ? "" : " where " + String.join(" and ", clauses);
    }

    private List<Object> extractIds(Object raw) {
        List<Object> ids = new ArrayList<>();
        if (raw instanceof Iterable) {
            for (Object item : (Iterable<?>) raw) {
                if (!isEmpty(item)) {
                    ids.add(item);
                }
            }
        } else if (!isEmpty(raw)) {
            ids.add(raw);
        }
        return ids;
    }

    private List<Map<String, Object>> loadBaseAccounts(List<Object> accountIds) {
        if (!tableExists("account") || !tableHasColumn("account", "id")) {
            throw new BizException("未找到基础账号表 account");
        }
        String placeholders = accountIds.stream().map(id -> "?").collect(Collectors.joining(","));
        List<Object> args = new ArrayList<>(accountIds);
        List<String> clauses = new ArrayList<>();
        clauses.add("`id` in (" + placeholders + ")");
        if (tableHasColumn("account", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("account", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> accounts = jdbcTemplate.queryForList(
                "select * from `account` where " + String.join(" and ", clauses), args.toArray());
        fillAccountCategoryNames(accounts);
        return accounts;
    }

    private Map<String, Object> loadPublishConfig(Object configId, Object configName) {
        if (!tableExists("publish_config")) {
            return Collections.emptyMap();
        }
        List<String> clauses = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        if (!isEmpty(configId) && tableHasColumn("publish_config", "id")) {
            clauses.add("`id` = ?");
            args.add(configId);
        } else if (!isEmpty(configName) && tableHasColumn("publish_config", "name")) {
            clauses.add("`name` = ?");
            args.add(configName);
        }
        if (clauses.isEmpty()) {
            return Collections.emptyMap();
        }
        if (tableHasColumn("publish_config", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("publish_config", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select * from `publish_config` where " + String.join(" and ", clauses) + " limit 1",
                args.toArray());
        return rows.isEmpty() ? Collections.emptyMap() : rows.get(0);
    }

    private void updatePublishConfigSelectionAudit(Map<String, Object> body) {
        Object selectionAudit = body == null ? null : firstNonEmpty(body.get("selection_audit"), body.get("selectionAudit"));
        if (isEmpty(selectionAudit)) {
            return;
        }
        Object configId = body == null ? null : firstNonEmpty(
                body.get("config_id"), body.get("configId"), body.get("publish_config_id"), body.get("publishConfigId"));
        Object configName = body == null ? null : firstNonEmpty(
                body.get("config_name"), body.get("configName"), body.get("publish_config_name"), body.get("publishConfigName"));
        if (isEmpty(configId) && isEmpty(configName)) {
            throw new BizException("请选择发布配置");
        }
        ensurePublishConfigSelectionAuditColumn();

        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        if (!isEmpty(configId) && tableHasColumn("publish_config", "id")) {
            clauses.add("`id` = ?");
            args.add(configId);
        } else if (!isEmpty(configName) && tableHasColumn("publish_config", "name")) {
            clauses.add("`name` = ?");
            args.add(configName);
        }
        if (clauses.isEmpty()) {
            throw new BizException("发布配置不存在");
        }
        if (tableHasColumn("publish_config", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("publish_config", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }

        List<Object> updateArgs = new ArrayList<>();
        updateArgs.add(normalizeSelectionAudit(selectionAudit));
        updateArgs.addAll(args);
        int updated = jdbcTemplate.update("update `publish_config` set `selection_audit` = ? where " +
                String.join(" and ", clauses), updateArgs.toArray());
        if (updated <= 0) {
            throw new BizException("发布配置不存在或无权限");
        }
    }

    private void ensurePublishConfigSelectionAuditColumn() {
        if (!tableExists("publish_config")) {
            throw new BizException("未找到 publish_config 表");
        }
        if (!tableHasColumn("publish_config", "selection_audit")) {
            jdbcTemplate.execute("alter table `publish_config` add column `selection_audit` tinyint null default 0 comment '选品是否审核：0否 1是'");
        }
    }

    private int normalizeSelectionAudit(Object value) {
        if (value instanceof Number) {
            return ((Number) value).intValue() == 1 ? 1 : 0;
        }
        String text = String.valueOf(value == null ? "" : value).trim();
        return "1".equals(text) || "true".equalsIgnoreCase(text) || "是".equals(text) ? 1 : 0;
    }

    private Map<String, Object> loadSelectionStrategy(Object selectionStrategyId) {
        if (isEmpty(selectionStrategyId) || !tableExists("product_selection_strategy")
                || !tableHasColumn("product_selection_strategy", "id")) {
            return Collections.emptyMap();
        }
        List<String> clauses = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        clauses.add("`id` = ?");
        args.add(selectionStrategyId);
        if (tableHasColumn("product_selection_strategy", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("product_selection_strategy", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select * from `product_selection_strategy` where " + String.join(" and ", clauses) + " limit 1",
                args.toArray());
        return rows.isEmpty() ? Collections.emptyMap() : rows.get(0);
    }

    private void fillAccountCategoryNames(List<Map<String, Object>> accounts) {
        if (accounts == null || accounts.isEmpty()
                || !tableExists("product_category")
                || !tableHasColumn("product_category", "id")
                || !tableHasColumn("product_category", "name")) {
            return;
        }
        List<Object> ids = accounts.stream()
                .map(row -> firstValue(row, "product_category_id", "productCategoryId"))
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (ids.isEmpty()) {
            return;
        }
        String placeholders = ids.stream().map(id -> "?").collect(Collectors.joining(","));
        List<Object> args = new ArrayList<>(ids);
        String categoryFilter = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tableHasColumn("product_category", "deleted")) {
            categoryFilter += " and `deleted` = 0";
        }
        if (tenantId != null && tableHasColumn("product_category", "tenant_id")) {
            categoryFilter += " and `tenant_id` = ?";
            args.add(tenantId);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select `id`, `name` from `product_category` where `id` in (" + placeholders + ")" + categoryFilter,
                args.toArray());
        Map<String, String> names = toStringMap(rows, "id", "name");
        accounts.forEach(account -> {
            Object categoryId = firstValue(account, "product_category_id", "productCategoryId");
            String categoryName = categoryId == null ? null : names.get(String.valueOf(categoryId));
            if (categoryName != null) {
                account.put("product_category_name", categoryName);
                account.put("productCategoryName", categoryName);
            }
        });
    }

    private void fillAccountProxy(List<Map<String, Object>> accounts) {
        if (accounts == null || accounts.isEmpty()) {
            return;
        }
        String proxyTable = tableExists("proxy") ? "proxy" : (tableExists("proxy_config") ? "proxy_config" : null);
        if (proxyTable == null || !tableHasColumn(proxyTable, "id")) {
            return;
        }
        List<Object> proxyIds = accounts.stream()
                .map(row -> firstValue(row, "proxy_id", "proxyId"))
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (proxyIds.isEmpty()) {
            return;
        }

        String placeholders = proxyIds.stream().map(id -> "?").collect(Collectors.joining(","));
        List<Object> args = new ArrayList<>(proxyIds);
        List<String> clauses = new ArrayList<>();
        clauses.add("`id` in (" + placeholders + ")");
        if (tableHasColumn(proxyTable, "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn(proxyTable, "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }

        List<Map<String, Object>> proxies = jdbcTemplate.queryForList(
                "select * from " + quote(proxyTable) + " where " + String.join(" and ", clauses),
                args.toArray());
        Map<String, Map<String, Object>> proxyMap = new HashMap<>();
        for (Map<String, Object> proxy : proxies) {
            Object id = firstValue(proxy, "id");
            if (id != null) {
                proxyMap.put(String.valueOf(id), proxy);
            }
        }
        for (Map<String, Object> account : accounts) {
            Object proxyId = firstValue(account, "proxy_id", "proxyId");
            Map<String, Object> proxy = proxyId == null ? null : proxyMap.get(String.valueOf(proxyId));
            if (proxy != null) {
                account.put("proxy", proxy);
                account.put("proxyConfig", proxy);
            }
        }
    }

    private LinkedHashMap<String, Object> valuesFromAccount(
            Map<String, Object> account,
            Map<String, Object> config,
            Object robotId,
            List<Map<String, Object>> columns) {
        LinkedHashMap<String, Object> values = new LinkedHashMap<>();
        for (Map<String, Object> column : columns) {
            String name = String.valueOf(column.get("name"));
            if (!Boolean.TRUE.equals(column.get("editable")) || isLinkedAccountDisplayColumn(name)
                    || isRuntimeStatusColumn(column) || !account.containsKey(name)) {
                continue;
            }
            values.put(name, account.get(name));
        }

        Object accountId = firstValue(account, "id");
        putFirstColumn(values, columns, firstNonEmpty(accountId), "account_id", "source_account_id", "base_account_id");
        putFirstColumn(values, columns, firstValue(account, "baiying_id", "baiyingId", "baiying_uid", "buyin_id", "buyin_uid", "platform_account_id"),
                "baiying_id", "baiying_uid", "buyin_id", "buyin_uid", "platform_account_id");
        putFirstColumn(values, columns, firstValue(account, "product_category_name", "productCategoryName"),
                "product_category_name", "category_names", "categoryNames");
        putFirstColumn(values, columns, firstValue(account, "product_category_id", "productCategoryId"),
                "product_category_id", "category_ids", "categoryIds");
        putFirstColumn(values, columns, firstValue(account, "fans_count", "fansCount"), "fans_count", "fansCount");

        Object configId = firstValue(config, "id");
        Object configName = firstValue(config, "name", "config_name");
        putFirstColumn(values, columns, configId, "config_id", "publish_config_id");
        putFirstColumn(values, columns, robotId, "robot_id");
        putFirstColumn(values, columns, configName, "config_name", "publish_config_name");

        Object owner = firstNonEmpty(firstValue(account, "user_id", "userId"), currentUid());
        putFirstColumn(values, columns, owner, "user_id");
        putFirstColumn(values, columns, 0, "today_selection_count", "selection_count_today", "today_select_count");

        Map<String, Object> idColumn = findColumn(columns, "id");
        if (idColumn != null && !Boolean.TRUE.equals(idColumn.get("autoIncrement"))) {
            values.put("id", IdWorker.getId());
        }
        if (hasColumn(columns, "deleted")) {
            values.put("deleted", 0);
        }
        if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
            values.put("tenant_id", TenantUtils.currentTenantId());
        }
        return values;
    }

    private void putFirstColumn(LinkedHashMap<String, Object> values, List<Map<String, Object>> columns, Object value, String... names) {
        if (isEmpty(value)) {
            return;
        }
        for (String name : names) {
            Map<String, Object> column = findColumn(columns, name);
            if (column != null && Boolean.TRUE.equals(column.get("editable"))) {
                values.put(name, value);
                return;
            }
        }
    }

    private Object insertValues(LinkedHashMap<String, Object> values) {
        StringJoiner columnPart = new StringJoiner(", ");
        StringJoiner valuePart = new StringJoiner(", ");
        List<Object> args = new ArrayList<>();
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            columnPart.add(quote(entry.getKey()));
            valuePart.add("?");
            args.add(entry.getValue());
        }
        String sql = "insert into " + QUOTED_TABLE_NAME + " (" + columnPart + ") values (" + valuePart + ")";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.size(); i++) {
                ps.setObject(i + 1, args.get(i));
            }
            return ps;
        }, keyHolder);
        Number generatedKey = keyHolder.getKey();
        if (generatedKey != null) {
            return generatedKey.longValue();
        }
        return firstNonEmpty(values.get("id"), values.get("ID"));
    }

    private String currentUid() {
        try {
            SysUser user = ShiroUtils.getSysUser();
            return user == null ? null : user.getUid();
        } catch (Exception ignored) {
            return null;
        }
    }

    private void enrichRows(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        Map<String, String> configNames = configNameMap();
        Map<String, String> robotNames = robotNameMap();
        Map<String, String> sysUserNames = sysUserNameMap();
        Map<String, String> userNames = userNameMap();
        Map<String, Map<String, Object>> baseAccounts = baseAccountMap(rows);
        Map<String, Integer> todayPublishCounts = todayPublishCountMap(rows);
        Map<String, Object> lastPublishTimes = lastPublishTimeMap(rows);
        Map<String, List<Map<String, Object>>> publishConditions = publishConditionsMap(rows);
        for (Map<String, Object> row : rows) {
            Object accountId = firstValue(row, "account_id", "accountId", "source_account_id", "base_account_id");
            Map<String, Object> baseAccount = accountId == null ? null : baseAccounts.get(String.valueOf(accountId));
            Object configId = firstValue(row, "config_id", "publish_config_id", "publish_config");
            Object robotId = firstValue(row, "robot_id", "robotId");
            Object ownerId = firstValue(row, "user_id", "userId");
            Object publishAccountId = firstValue(row, "id");
            List<Map<String, Object>> conditions = publishAccountId == null
                    ? Collections.emptyList()
                    : publishConditions.getOrDefault(String.valueOf(publishAccountId), Collections.emptyList());

            row.put("displayAvatar", baseAccount == null ? null : firstValue(baseAccount, "avatar", "avatar_url", "head_img", "head_img_url", "head_image"));
            row.put("displayNickname", baseAccount == null ? null : firstValue(baseAccount, "nickname", "nick_name", "nick", "account_name", "name"));
            row.put("displayBaiyingId", baseAccount == null ? null : firstValue(baseAccount, "baiying_id", "baiyingId", "baiying_uid", "buyin_id", "buyin_uid", "platform_account_id"));
            row.put("displayLastLoginTime", baseAccount == null ? null : firstValue(baseAccount, "last_login_time", "lastLoginTime"));
            row.put("loginStatus", firstNonEmpty(firstValue(row, "login_status", "loginStatus"), "未登录"));
            row.put("loginErrorReason", firstValue(row, "login_error_reason", "loginErrorReason"));
            row.put("displayCategoryNames", baseAccount == null ? null : firstValue(baseAccount,
                    "product_category_name", "productCategoryName", "category_names", "categoryNames"));
            row.put("displayConfigName", firstNonEmpty(
                    firstValue(row, "config_name", "publish_config_name"),
                    configId == null ? null : configNames.get(String.valueOf(configId))));
            row.put("displayRobotName", robotId == null ? null : robotNames.get(String.valueOf(robotId)));
            row.put("dailyMaxPublishCount", baseAccount == null ? 0 : firstValue(baseAccount,
                    "daily_max_publish_count", "dailyMaxPublishCount"));
            row.put("publishConditions", conditions);
            row.put("publishConditionTotalNum", publishConditionTotalNum(conditions));
            row.put("todaySelectionCount", firstValue(row, "today_selection_count", "selection_count_today",
                    "today_select_count", "today_product_count", "selection_count"));
            row.put("todayPublishCount", accountId == null ? 0 : todayPublishCounts.getOrDefault(String.valueOf(accountId), 0));
            row.put("displayLastPublishTime", accountId == null ? null : lastPublishTimes.get(String.valueOf(accountId)));
            row.put("ownerName", firstNonEmpty(
                    firstValue(row, "owner_name", "user_name", "username", "uname"),
                    ownerId == null ? null : sysUserNames.get(String.valueOf(ownerId)),
                    ownerId == null ? null : userNames.get(String.valueOf(ownerId)),
                    ownerId));
            row.put("currentStatus", firstNonEmpty(runtimeStatusValue(row), "离线"));
        }
    }

    private Map<String, Integer> todayPublishCountMap(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()
                || !tableExists("publish_record")
                || !tableHasColumn("publish_record", "account_id")
                || !tableHasColumn("publish_record", "update_time")
                || !tableHasColumn("publish_record", "status")) {
            return Collections.emptyMap();
        }
        List<Object> accountIds = rows.stream()
                .map(row -> firstValue(row, "account_id", "accountId", "source_account_id", "base_account_id"))
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (accountIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        LocalDate today = LocalDate.now();
        clauses.add("`update_time` >= ?");
        args.add(today.atStartOfDay());
        clauses.add("`update_time` < ?");
        args.add(today.plusDays(1).atStartOfDay());
        clauses.add("`status` = ?");
        args.add("发布成功");
        String placeholders = accountIds.stream().map(id -> "?").collect(Collectors.joining(", "));
        clauses.add("`account_id` in (" + placeholders + ")");
        args.addAll(accountIds);
        if (tableHasColumn("publish_record", "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("publish_record", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }

        List<Map<String, Object>> countRows = jdbcTemplate.queryForList(
                "select `account_id`, count(1) as `publish_count` from `publish_record` where " +
                        String.join(" and ", clauses) + " group by `account_id`",
                args.toArray());
        Map<String, Integer> result = new HashMap<>();
        for (Map<String, Object> row : countRows) {
            Object accountId = firstValue(row, "account_id", "accountId");
            if (accountId != null) {
                result.put(String.valueOf(accountId), intValue(firstValue(row, "publish_count", "count")));
            }
        }
        return result;
    }

    private Map<String, Object> lastPublishTimeMap(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()
                || !tableExists("publish_record")
                || !tableHasColumn("publish_record", "account_id")
                || !tableHasColumn("publish_record", "status")
                || !tableHasColumn("publish_record", "update_time")) {
            return Collections.emptyMap();
        }
        List<Object> accountIds = rows.stream()
                .map(row -> firstValue(row, "account_id", "accountId", "source_account_id", "base_account_id"))
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (accountIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        String placeholders = accountIds.stream().map(id -> "?").collect(Collectors.joining(", "));
        clauses.add("`account_id` in (" + placeholders + ")");
        args.addAll(accountIds);
        clauses.add("`status` = ?");
        args.add("发布成功");
        clauses.add("`update_time` is not null");
        appendPublishRecordFilters(clauses, args);

        List<Map<String, Object>> rowsByAccount = jdbcTemplate.queryForList(
                "select `account_id`, max(`update_time`) as `last_publish_time` from `publish_record` where " +
                        String.join(" and ", clauses) + " group by `account_id`",
                args.toArray());
        Map<String, Object> result = new HashMap<>();
        for (Map<String, Object> row : rowsByAccount) {
            Object accountId = firstValue(row, "account_id", "accountId");
            if (accountId != null) {
                result.put(String.valueOf(accountId), firstValue(row, "last_publish_time", "lastPublishTime"));
            }
        }
        return result;
    }

    private Map<String, List<Map<String, Object>>> publishConditionsMap(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()
                || !tableExists(PUBLISH_CONDITION_TABLE_NAME)
                || !tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_account_id")) {
            return Collections.emptyMap();
        }
        List<Object> publishAccountIds = rows.stream()
                .map(row -> firstValue(row, "id"))
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (publishAccountIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Object> args = new ArrayList<>();
        String placeholders = publishAccountIds.stream().map(id -> "?").collect(Collectors.joining(", "));
        args.addAll(publishAccountIds.stream().map(id -> String.valueOf(id)).collect(Collectors.toList()));
        List<String> clauses = new ArrayList<>();
        clauses.add("`publish_account_id` in (" + placeholders + ")");
        if (tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "deleted")) {
            clauses.add("ifnull(`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        String order = tableHasColumn(PUBLISH_CONDITION_TABLE_NAME, "publish_time_range_begin")
                ? " order by `publish_time_range_begin` asc, `id` asc"
                : " order by `id` asc";
        List<Map<String, Object>> conditionRows = jdbcTemplate.queryForList(
                "select * from " + QUOTED_PUBLISH_CONDITION_TABLE_NAME +
                        " where " + String.join(" and ", clauses) + order,
                args.toArray());
        Map<String, List<Map<String, Object>>> result = new HashMap<>();
        for (Map<String, Object> row : conditionRows) {
            Object publishAccountId = firstValue(row, "publish_account_id", "publishAccountId");
            if (publishAccountId == null) {
                continue;
            }
            Map<String, Object> condition = new LinkedHashMap<>();
            condition.put("id", firstValue(row, "id"));
            condition.put("publishAccountId", publishAccountId);
            condition.put("publish_time_range_begin", firstValue(row, "publish_time_range_begin", "publishTimeRangeBegin"));
            condition.put("publishTimeRangeBegin", firstValue(row, "publish_time_range_begin", "publishTimeRangeBegin"));
            condition.put("publish_time_range_end", firstValue(row, "publish_time_range_end", "publishTimeRangeEnd"));
            condition.put("publishTimeRangeEnd", firstValue(row, "publish_time_range_end", "publishTimeRangeEnd"));
            condition.put("publish_num", firstValue(row, "publish_num", "publishNum"));
            condition.put("publishNum", firstValue(row, "publish_num", "publishNum"));
            result.computeIfAbsent(String.valueOf(publishAccountId), key -> new ArrayList<>()).add(condition);
        }
        return result;
    }

    private int publishConditionTotalNum(List<Map<String, Object>> conditions) {
        if (conditions == null || conditions.isEmpty()) {
            return 0;
        }
        int total = 0;
        for (Map<String, Object> condition : conditions) {
            total += intValue(firstValue(condition, "publish_num", "publishNum"));
        }
        return total;
    }

    private boolean publishLimitReached(Map<String, Object> publishAccount, Map<String, Object> baseAccount) {
        return remainingPublishCount(publishAccount, baseAccount) <= 0;
    }

    private int remainingPublishCount(Map<String, Object> publishAccount, Map<String, Object> baseAccount) {
        int dailyRemainingCount = dailyRemainingPublishCount(publishAccount, baseAccount);
        if (publishAccount != null && publishAccount.containsKey("publishConditionRemainingCount")) {
            int conditionRemainingCount = Math.max(intValue(publishAccount.get("publishConditionRemainingCount")), 0);
            return Math.min(conditionRemainingCount, dailyRemainingCount);
        }
        return dailyRemainingCount;
    }

    private int dailyRemainingPublishCount(Map<String, Object> publishAccount, Map<String, Object> baseAccount) {
        int dailyMaxPublishCount = accountDailyMaxPublishCount(baseAccount);
        if (dailyMaxPublishCount <= 0) {
            return 0;
        }
        int todayPublishCount = publishAccount == null
                ? 0
                : intValue(firstValue(publishAccount, "todayPublishCount", "today_publish_count"));
        return Math.max(dailyMaxPublishCount - todayPublishCount, 0);
    }

    private int accountDailyMaxPublishCount(Map<String, Object> baseAccount) {
        if (baseAccount == null || baseAccount.isEmpty()) {
            return 0;
        }
        return Math.max(intValue(firstValue(baseAccount, "daily_max_publish_count", "dailyMaxPublishCount")), 0);
    }

    private Map<String, Map<String, Object>> baseAccountMap(List<Map<String, Object>> rows) {
        if (!tableExists("account") || !tableHasColumn("account", "id")) {
            return Collections.emptyMap();
        }
        List<Object> accountIds = rows.stream()
                .map(row -> firstValue(row, "account_id", "accountId", "source_account_id", "base_account_id"))
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (accountIds.isEmpty()) {
            return Collections.emptyMap();
        }

        String placeholders = accountIds.stream().map(id -> "?").collect(Collectors.joining(","));
        List<Object> args = new ArrayList<>(accountIds);
        List<String> clauses = new ArrayList<>();
        clauses.add("`id` in (" + placeholders + ")");
        if (tableHasColumn("account", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("account", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        List<Map<String, Object>> accounts = jdbcTemplate.queryForList(
                "select * from `account` where " + String.join(" and ", clauses),
                args.toArray());
        fillAccountCategoryNames(accounts);
        Map<String, Map<String, Object>> map = new HashMap<>();
        for (Map<String, Object> account : accounts) {
            Object id = firstValue(account, "id");
            if (id != null) {
                map.put(String.valueOf(id), account);
            }
        }
        return map;
    }

    private void ensureBaseAccountLastLoginTimeColumn() {
        if (tableExists("account") && !tableHasColumn("account", "last_login_time")) {
            jdbcTemplate.execute("alter table `account` add column `last_login_time` datetime null default null comment '最近登录时间'");
        }
    }

    private void ensurePublishAccountLoginColumns() {
        if (!tableExists(TABLE_NAME)) {
            return;
        }
        if (!tableHasColumn(TABLE_NAME, "login_status")) {
            jdbcTemplate.execute("alter table " + QUOTED_TABLE_NAME +
                    " add column `login_status` varchar(20) character set utf8mb4 collate utf8mb4_unicode_ci null default '未登录' comment '登录状态：未登录、已登录、异常'");
        }
        if (!tableHasColumn(TABLE_NAME, "login_error_reason")) {
            jdbcTemplate.execute("alter table " + QUOTED_TABLE_NAME +
                    " add column `login_error_reason` varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '登录异常原因'");
        }
    }

    private Map<String, String> configNameMap() {
        if (!tableExists("publish_config") || !tableHasColumn("publish_config", "id") || !tableHasColumn("publish_config", "name")) {
            return Collections.emptyMap();
        }
        List<String> clauses = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        if (tableHasColumn("publish_config", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("publish_config", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        String where = clauses.isEmpty() ? "" : " where " + String.join(" and ", clauses);
        return toStringMap(jdbcTemplate.queryForList("select `id`, `name` from `publish_config`" + where, args.toArray()), "id", "name");
    }

    private Map<String, String> robotNameMap() {
        if (!tableExists("robot") || !tableHasColumn("robot", "id") || !tableHasColumn("robot", "machine_name")) {
            return Collections.emptyMap();
        }
        List<String> clauses = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        if (tableHasColumn("robot", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("robot", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        String macSelect = tableHasColumn("robot", "mac_address")
                ? "`mac_address`"
                : "null";
        String where = clauses.isEmpty() ? "" : " where " + String.join(" and ", clauses);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select `id`, `machine_name`, " + macSelect + " as `mac_address` from `robot`" + where,
                args.toArray());
        Map<String, String> result = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Object id = firstValue(row, "id");
            Object machineName = firstValue(row, "machine_name", "machineName");
            Object macAddress = firstValue(row, "mac_address", "macAddress");
            if (id != null && machineName != null) {
                String label = String.valueOf(machineName);
                if (!isEmpty(macAddress)) {
                    label += " / " + macAddress;
                }
                result.put(String.valueOf(id), label);
            }
        }
        return result;
    }

    private Map<String, String> sysUserNameMap() {
        if (!tableExists("sys_user") || !tableHasColumn("sys_user", "uid")) {
            return Collections.emptyMap();
        }
        String nameColumn = tableHasColumn("sys_user", "nick") ? "nick" : "uname";
        if (!tableHasColumn("sys_user", nameColumn)) {
            return Collections.emptyMap();
        }
        List<Object> args = new ArrayList<>();
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
            return Collections.emptyMap();
        }
        String nameColumn = tableHasColumn("user", "nick_name") ? "nick_name" : "account";
        if (!tableHasColumn("user", nameColumn)) {
            return Collections.emptyMap();
        }
        List<Object> args = new ArrayList<>();
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

    private Object runtimeStatusValue(Map<String, Object> row) {
        Object namedStatus = firstValue(row,
                "current_status", "currentStatus",
                "runtime_status", "runtimeStatus",
                "account_runtime_status", "accountRuntimeStatus",
                "client_status", "clientStatus",
                "online_status", "onlineStatus");
        if (!isEmpty(namedStatus)) {
            return namedStatus;
        }
        Object genericStatus = firstValue(row, "status", "account_status", "accountStatus", "enabled");
        return isRuntimeStatusValue(genericStatus) ? genericStatus : null;
    }

    private Map<String, Object> findRuntimeStatusColumn(List<Map<String, Object>> columns) {
        for (String name : Arrays.asList(
                "current_status", "runtime_status", "account_runtime_status",
                "client_status", "online_status")) {
            Map<String, Object> column = findColumn(columns, name);
            if (column != null) {
                return column;
            }
        }
        for (Map<String, Object> column : columns) {
            if (isRuntimeStatusColumn(column)) {
                return column;
            }
        }
        return null;
    }

    private boolean isLinkedAccountDisplayColumn(String name) {
        return "avatar".equalsIgnoreCase(name)
                || "avatar_url".equalsIgnoreCase(name)
                || "head_img".equalsIgnoreCase(name)
                || "head_img_url".equalsIgnoreCase(name)
                || "head_image".equalsIgnoreCase(name)
                || "nickname".equalsIgnoreCase(name)
                || "nick_name".equalsIgnoreCase(name)
                || "nick".equalsIgnoreCase(name)
                || "account_name".equalsIgnoreCase(name)
                || "name".equalsIgnoreCase(name);
    }

    private boolean isRuntimeStatusColumn(Map<String, Object> column) {
        String name = String.valueOf(column.get("name")).toLowerCase();
        String text = String.valueOf(firstNonEmpty(column.get("label"), column.get("comment")));
        return "current_status".equals(name)
                || "runtime_status".equals(name)
                || "account_runtime_status".equals(name)
                || "client_status".equals(name)
                || "online_status".equals(name)
                || (("status".equals(name) || "account_status".equals(name) || "enabled".equals(name))
                && (text.contains("当前状态") || text.contains("运行状态") || text.contains("客户端")));
    }

    private boolean isRuntimeStatusValue(Object value) {
        if (isEmpty(value)) {
            return false;
        }
        String text = String.valueOf(value).trim();
        return !"0".equals(text)
                && !"1".equals(text)
                && !"2".equals(text)
                && !"true".equalsIgnoreCase(text)
                && !"false".equalsIgnoreCase(text)
                && !"启用".equals(text)
                && !"禁用".equals(text)
                && !"授权过期".equals(text);
    }

    private LinkedHashMap<String, Object> editableValues(Map<String, Object> body, List<Map<String, Object>> columns) {
        LinkedHashMap<String, Object> values = new LinkedHashMap<>();
        if (body == null) {
            return values;
        }
        for (Map<String, Object> column : columns) {
            String name = String.valueOf(column.get("name"));
            if (!Boolean.TRUE.equals(column.get("editable")) || !body.containsKey(name)) {
                continue;
            }
            values.put(name, body.get(name));
        }
        return values;
    }

    private List<Map<String, Object>> requireColumns() {
        List<Map<String, Object>> columns = columns();
        if (columns.isEmpty()) {
            throw new BizException("未找到 publish_account 表结构");
        }
        return columns;
    }

    private boolean hasColumn(List<Map<String, Object>> columns, String name) {
        return findColumn(columns, name) != null;
    }

    private String firstExistingColumn(List<Map<String, Object>> columns, String... names) {
        for (String name : names) {
            Map<String, Object> column = findColumn(columns, name);
            if (column != null) {
                Object actualName = firstValue(column, "name");
                return actualName == null ? name : String.valueOf(actualName);
            }
        }
        return null;
    }

    private Map<String, Object> findColumn(List<Map<String, Object>> columns, String name) {
        for (Map<String, Object> column : columns) {
            if (name.equalsIgnoreCase(String.valueOf(column.get("name")))) {
                return column;
            }
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

    private String quote(String column) {
        return "`" + column.replace("`", "``") + "`";
    }

    private String labelOf(String name) {
        if ("avatar".equalsIgnoreCase(name) || "avatar_url".equalsIgnoreCase(name)) return "头像";
        if ("nickname".equalsIgnoreCase(name) || "nick_name".equalsIgnoreCase(name) || "nick".equalsIgnoreCase(name)) return "昵称";
        if ("baiying_id".equalsIgnoreCase(name) || "buyin_id".equalsIgnoreCase(name)) return "百应ID";
        if ("config_id".equalsIgnoreCase(name) || "publish_config_id".equalsIgnoreCase(name)) return "发布配置";
        if ("config_name".equalsIgnoreCase(name) || "publish_config_name".equalsIgnoreCase(name)) return "配置名称";
        if ("publish_time_range_begin".equalsIgnoreCase(name)) return "发布时间范围开始";
        if ("publish_time_range_end".equalsIgnoreCase(name)) return "发布时间范围结束";
        if ("today_selection_count".equalsIgnoreCase(name)) return "今日选品数";
        if ("today_publish_count".equalsIgnoreCase(name)) return "今日发布数";
        if ("user_id".equalsIgnoreCase(name)) return "所属用户";
        if ("login_status".equalsIgnoreCase(name)) return "登录状态";
        if ("login_error_reason".equalsIgnoreCase(name)) return "异常原因";
        if ("status".equalsIgnoreCase(name) || "account_status".equalsIgnoreCase(name) || "current_status".equalsIgnoreCase(name)) return "当前状态";
        return name;
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

    private String stringValue(Map<String, Object> row, String key) {
        Object object = value(row, key);
        return object == null ? null : String.valueOf(object);
    }

    private Object value(Map<String, Object> row, String key) {
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (key.equalsIgnoreCase(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private boolean isEmpty(Object value) {
        return value == null || String.valueOf(value).trim().isEmpty();
    }
}
