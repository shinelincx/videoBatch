package com.lu.admin.modules.publish.service;

import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.shiro.ShiroUtils;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.sys.entity.SysUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;

@Service
public class PublishConfigService {

    private static final String TABLE_NAME = "publish_config";
    private static final String QUOTED_TABLE_NAME = "`publish_config`";
    private static final Set<String> SYSTEM_COLUMNS = new HashSet<>(Arrays.asList(
            "id", "create_time", "update_time", "deleted"
    ));

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile boolean publishConfigColumnsReady = false;

    public List<Map<String, Object>> columns() {
        ensureTableShape();
        String sql = "select COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, COLUMN_COMMENT, IS_NULLABLE, " +
                "COLUMN_DEFAULT, COLUMN_KEY, EXTRA from information_schema.COLUMNS " +
                "where TABLE_SCHEMA = DATABASE() and TABLE_NAME = ? order by ORDINAL_POSITION";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, TABLE_NAME);
        Set<String> physicalColumnNames = new HashSet<>();
        for (Map<String, Object> row : rows) {
            String name = stringValue(row, "COLUMN_NAME");
            if (name != null) {
                physicalColumnNames.add(name.toLowerCase());
            }
        }
        List<Map<String, Object>> columns = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String name = stringValue(row, "COLUMN_NAME");
            if (isRemovedPublishLimitColumn(name)) {
                continue;
            }
            if (isShadowAliasColumn(name, physicalColumnNames)) {
                continue;
            }
            String extra = stringValue(row, "EXTRA");
            String columnKey = stringValue(row, "COLUMN_KEY");
            String comment = stringValue(row, "COLUMN_COMMENT");
            boolean system = SYSTEM_COLUMNS.contains(name.toLowerCase());
            boolean owner = isOwnerColumn(name, comment);
            boolean tenant = isTenantColumn(name, comment);
            boolean selectionStrategy = isSelectionStrategyColumn(name, comment);

            Map<String, Object> column = new LinkedHashMap<>();
            column.put("name", name);
            column.put("label", labelOf(name, comment, owner, tenant));
            column.put("dataType", stringValue(row, "DATA_TYPE"));
            column.put("columnType", stringValue(row, "COLUMN_TYPE"));
            column.put("comment", comment);
            column.put("nullable", "YES".equalsIgnoreCase(stringValue(row, "IS_NULLABLE")));
            column.put("defaultValue", value(row, "COLUMN_DEFAULT"));
            column.put("primaryKey", "PRI".equalsIgnoreCase(columnKey));
            column.put("autoIncrement", extra != null && extra.toLowerCase().contains("auto_increment"));
            column.put("system", system);
            column.put("editable", !system && !owner && !tenant && !selectionStrategy);
            columns.add(column);
        }
        return columns;
    }

    private synchronized void ensureTableShape() {
        if (publishConfigColumnsReady) {
            return;
        }
        if (!tableExists(TABLE_NAME)) {
            return;
        }
        ensureColumn("self_declaration",
                "varchar(100) character set utf8mb4 collate utf8mb4_unicode_ci null default '无需添加自主声明' comment '自主声明'");
        ensureColumn("sync_publish",
                "varchar(50) character set utf8mb4 collate utf8mb4_unicode_ci null default '不同时发布' comment '同时发布'");
        ensureColumn("visibility",
                "varchar(50) character set utf8mb4 collate utf8mb4_unicode_ci null default '公开' comment '谁可以看'");
        ensureColumn("save_permission",
                "varchar(50) character set utf8mb4 collate utf8mb4_unicode_ci null default '允许' comment '保存权限'");
        ensureColumn("publish_time",
                "varchar(50) character set utf8mb4 collate utf8mb4_unicode_ci null default '立即发布' comment '发布时间'");
        ensureColumn("publish_interval",
                "int null default 0 comment '发布间隔频率(分钟)'");
        copyNumberColumnIfTargetEmpty("publishInterval", "publish_interval");
        ensureColumn("publish_dir",
                "varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '发布目录'");
        ensureColumn("clip_config_id",
                "bigint null default null comment '关联剪辑配置id'");
        ensureColumn("selection_audit",
                "tinyint null default 0 comment '选品是否审核：0否 1是'");
        publishConfigColumnsReady = true;
    }

    private void ensureColumn(String columnName, String columnDefinition) {
        if (!tableHasColumn(TABLE_NAME, columnName)) {
            jdbcTemplate.execute("alter table " + QUOTED_TABLE_NAME + " add column `" + columnName + "` " + columnDefinition);
        }
    }

    private void copyNumberColumnIfTargetEmpty(String sourceColumn, String targetColumn) {
        if (!tableHasColumn(TABLE_NAME, sourceColumn) || !tableHasColumn(TABLE_NAME, targetColumn)) {
            return;
        }
        jdbcTemplate.update("update " + QUOTED_TABLE_NAME +
                " set " + quote(targetColumn) + " = " + quote(sourceColumn) +
                " where " + quote(sourceColumn) + " is not null" +
                " and (" + quote(targetColumn) + " is null or " + quote(targetColumn) + " = 0)");
    }

    private boolean isShadowAliasColumn(String name, Set<String> physicalColumnNames) {
        if (name == null || physicalColumnNames == null || physicalColumnNames.isEmpty()) {
            return false;
        }
        String lowerName = name.toLowerCase();
        return ("iscarrier".equals(lowerName) && physicalColumnNames.contains("is_carrier"))
                || ("publishinterval".equals(lowerName) && physicalColumnNames.contains("publish_interval"));
    }

    private boolean isRemovedPublishLimitColumn(String name) {
        if (name == null) {
            return false;
        }
        String lowerName = name.toLowerCase().replace("_", "");
        return "dailymaxpublishcount".equals(lowerName)
                || "maxdailypublish".equals(lowerName);
    }

    private String labelOf(String name, String comment, boolean owner, boolean tenant) {
        if (tenant) {
            return "所属租户";
        }
        if (owner && isEmpty(comment)) {
            return "所属用户";
        }
        String lowerName = name == null ? "" : name.toLowerCase();
        if ("name".equals(lowerName)) {
            return "配置名称";
        }
        if ("is_carrier".equals(lowerName) || "iscarrier".equals(lowerName)) {
            return "是否达人带货";
        }
        if ("publish_delay".equals(lowerName) || "publishdelay".equals(lowerName)) {
            return "发布延迟(小时)";
        }
        if ("publish_interval".equals(lowerName) || "publishinterval".equals(lowerName)) {
            return "发布间隔频率(分钟)";
        }
        if ("publish_dir".equals(lowerName) || "publishdir".equals(lowerName)) {
            return "发布目录";
        }
        if ("clip_config_id".equals(lowerName) || "clipconfigid".equals(lowerName)) {
            return "剪辑配置名称";
        }
        if ("self_declaration".equals(lowerName) || "selfdeclaration".equals(lowerName)) {
            return "自主声明";
        }
        if ("sync_publish".equals(lowerName) || "syncpublish".equals(lowerName)) {
            return "同时发布";
        }
        if ("visibility".equals(lowerName)) {
            return "谁可以看";
        }
        if ("save_permission".equals(lowerName) || "savepermission".equals(lowerName)) {
            return "保存权限";
        }
        if ("publish_time".equals(lowerName) || "publishtime".equals(lowerName)) {
            return "发布时间";
        }
        if ("selection_audit".equals(lowerName) || "selectionaudit".equals(lowerName)) {
            return "选品是否审核";
        }
        if (!isEmpty(comment)) {
            return comment;
        }
        if ("status".equals(lowerName)) {
            return "状态";
        }
        if ("remark".equals(lowerName)) {
            return "备注";
        }
        return name;
    }

    public Map<String, Object> page(Long current, Long size) {
        List<Map<String, Object>> columns = requireColumns();
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
        enrichRows(records, columns);

        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("total", total == null ? 0 : total.longValue());
        result.put("current", pageCurrent);
        result.put("size", pageSize);
        return result;
    }

    public List<Map<String, Object>> list() {
        List<Map<String, Object>> columns = requireColumns();
        List<Object> whereArgs = new ArrayList<>();
        String where = whereSql(columns, whereArgs);
        String order = hasColumn(columns, "id") ? " order by `id` desc" : "";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("select * from " + QUOTED_TABLE_NAME + where + order,
                whereArgs.toArray());
        enrichRows(rows, columns);
        return rows;
    }

    public void create(Map<String, Object> body) {
        List<Map<String, Object>> columns = requireColumns();
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
        putCurrentUser(values, columns);
        if (values.isEmpty()) {
            throw new BizException("发布配置没有可保存字段");
        }

        StringJoiner columnPart = new StringJoiner(", ");
        StringJoiner valuePart = new StringJoiner(", ");
        List<Object> args = new ArrayList<>();
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            columnPart.add(quote(entry.getKey()));
            valuePart.add("?");
            args.add(entry.getValue());
        }

        jdbcTemplate.update("insert into " + QUOTED_TABLE_NAME + " (" + columnPart + ") values (" + valuePart + ")",
                args.toArray());
    }

    public void update(Map<String, Object> body) {
        List<Map<String, Object>> columns = requireColumns();
        Object id = body == null ? null : body.get("id");
        if (isEmpty(id)) {
            throw new BizException("无法更新发布配置：参数为空（id）");
        }

        LinkedHashMap<String, Object> values = editableValues(body, columns);
        if (values.isEmpty()) {
            throw new BizException("发布配置没有可更新字段");
        }

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

        jdbcTemplate.update("update " + QUOTED_TABLE_NAME + " set " + setPart + " where `id` = ?" + tenantWhere, args.toArray());
    }

    public void delete(Map<String, Object> body) {
        List<Map<String, Object>> columns = requireColumns();
        Object id = body == null ? null : body.get("id");
        if (isEmpty(id)) {
            throw new BizException("无法删除发布配置：参数为空（id）");
        }
        if (hasColumn(columns, "deleted")) {
            List<Object> args = new ArrayList<>();
            args.add(id);
            String tenantWhere = "";
            if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
                tenantWhere = " and `tenant_id` = ?";
                args.add(TenantUtils.currentTenantId());
            }
            jdbcTemplate.update("update " + QUOTED_TABLE_NAME + " set `deleted` = 1 where `id` = ?" + tenantWhere, args.toArray());
        } else {
            List<Object> args = new ArrayList<>();
            args.add(id);
            String tenantWhere = "";
            if (hasColumn(columns, "tenant_id") && TenantUtils.currentTenantId() != null) {
                tenantWhere = " and `tenant_id` = ?";
                args.add(TenantUtils.currentTenantId());
            }
            jdbcTemplate.update("delete from " + QUOTED_TABLE_NAME + " where `id` = ?" + tenantWhere, args.toArray());
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

    private LinkedHashMap<String, Object> editableValues(Map<String, Object> body, List<Map<String, Object>> columns) {
        LinkedHashMap<String, Object> values = new LinkedHashMap<>();
        if (body == null) {
            return values;
        }
        for (Map<String, Object> column : columns) {
            String name = String.valueOf(column.get("name"));
            if (!Boolean.TRUE.equals(column.get("editable")) || isOwnerColumn(column) || isTenantColumn(column)
                    || isSelectionStrategyColumn(column) || !body.containsKey(name)) {
                continue;
            }
            values.put(name, body.get(name));
        }
        return values;
    }

    private void enrichRows(List<Map<String, Object>> rows, List<Map<String, Object>> columns) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        Map<String, Object> ownerColumn = findOwnerColumn(columns);
        Map<String, Object> tenantColumn = findTenantColumn(columns);
        Map<String, Object> clipConfigColumn = findClipConfigColumn(columns);
        Map<String, String> sysUserNames = ownerColumn == null ? new HashMap<>() : sysUserNameMap();
        Map<String, String> tenantNames = tenantColumn == null ? new HashMap<>() : tenantNameMap();
        Map<String, String> clipConfigNames = clipConfigColumn == null ? new HashMap<>() : clipConfigNameMap();
        String ownerColumnName = ownerColumn == null ? null : String.valueOf(ownerColumn.get("name"));
        String tenantColumnName = tenantColumn == null ? null : String.valueOf(tenantColumn.get("name"));
        String clipConfigColumnName = clipConfigColumn == null ? null : String.valueOf(clipConfigColumn.get("name"));
        for (Map<String, Object> row : rows) {
            if (ownerColumn != null) {
                Object ownerId = firstValue(row, ownerColumnName, "user_id", "userId");
                row.put("displayOwner", firstNonEmpty(
                        firstValue(row, "owner_name", "user_name", "username", "uname"),
                        ownerId == null ? null : sysUserNames.get(String.valueOf(ownerId))));
            }
            if (tenantColumn != null) {
                Object tenantId = firstValue(row, tenantColumnName, "tenant_id", "tenantId");
                row.put("displayTenant", firstNonEmpty(
                        firstValue(row, "tenant_name", "tenantName"),
                        tenantId == null ? null : tenantNames.get(String.valueOf(tenantId)),
                        tenantId));
            }
            if (clipConfigColumn != null) {
                Object clipConfigId = firstValue(row, clipConfigColumnName, "clip_config_id", "clipConfigId");
                row.put("displayClipConfigName", firstNonEmpty(
                        firstValue(row, "clip_config_name", "clipConfigName"),
                        clipConfigId == null ? null : clipConfigNames.get(String.valueOf(clipConfigId)),
                        clipConfigId));
            }
        }
    }

    private void putCurrentUser(LinkedHashMap<String, Object> values, List<Map<String, Object>> columns) {
        Map<String, Object> ownerColumn = findOwnerColumn(columns);
        if (ownerColumn == null) {
            return;
        }
        String name = String.valueOf(ownerColumn.get("name"));
        if (!isEmpty(values.get(name))) {
            return;
        }
        String uid = currentUid();
        if (!isEmpty(uid)) {
            values.put(name, uid);
        }
    }

    private Map<String, String> sysUserNameMap() {
        if (!tableExists("sys_user") || !tableHasColumn("sys_user", "uid")) {
            return new HashMap<>();
        }
        String nameExpression = sysUserNameExpression();
        if (nameExpression == null) {
            return new HashMap<>();
        }
        List<Object> args = new ArrayList<>();
        String where = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("sys_user", "tenant_id")) {
            where = " where `tenant_id` = ?";
            args.add(tenantId);
        }
        return toStringMap(jdbcTemplate.queryForList("select `uid`, " + nameExpression + " as `name` from `sys_user`" + where,
                args.toArray()), "uid", "name");
    }

    private String sysUserNameExpression() {
        boolean hasNick = tableHasColumn("sys_user", "nick");
        boolean hasUname = tableHasColumn("sys_user", "uname");
        if (hasNick && hasUname) {
            return "coalesce(nullif(`nick`, ''), nullif(`uname`, ''))";
        }
        if (hasNick) {
            return "nullif(`nick`, '')";
        }
        if (hasUname) {
            return "nullif(`uname`, '')";
        }
        return null;
    }

    private Map<String, String> tenantNameMap() {
        if (!tableExists("sys_tenant") || !tableHasColumn("sys_tenant", "id") || !tableHasColumn("sys_tenant", "name")) {
            return new HashMap<>();
        }
        List<String> clauses = new ArrayList<>();
        if (tableHasColumn("sys_tenant", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        String where = clauses.isEmpty() ? "" : " where " + String.join(" and ", clauses);
        return toStringMap(jdbcTemplate.queryForList("select `id`, `name` from `sys_tenant`" + where), "id", "name");
    }

    private Map<String, String> clipConfigNameMap() {
        if (!tableExists("clip_config") || !tableHasColumn("clip_config", "id") || !tableHasColumn("clip_config", "name")) {
            return new HashMap<>();
        }
        List<String> clauses = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        if (tableHasColumn("clip_config", "deleted")) {
            clauses.add("`deleted` = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("clip_config", "tenant_id")) {
            clauses.add("`tenant_id` = ?");
            args.add(tenantId);
        }
        String where = clauses.isEmpty() ? "" : " where " + String.join(" and ", clauses);
        return toStringMap(jdbcTemplate.queryForList("select `id`, `name` from `clip_config`" + where,
                args.toArray()), "id", "name");
    }

    private Map<String, String> toStringMap(List<Map<String, Object>> rows, String key, String valueKey) {
        Map<String, String> map = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Object id = firstValue(row, key);
            Object name = firstValue(row, valueKey);
            if (id != null && name != null) {
                map.put(String.valueOf(id), String.valueOf(name));
            }
        }
        return map;
    }

    private String currentUid() {
        try {
            SysUser user = ShiroUtils.getSysUser();
            return user == null ? null : user.getUid();
        } catch (Exception ignored) {
            return null;
        }
    }

    private List<Map<String, Object>> requireColumns() {
        List<Map<String, Object>> columns = columns();
        if (columns.isEmpty()) {
            throw new BizException("未找到 publish_config 表结构");
        }
        return columns;
    }

    private boolean hasColumn(List<Map<String, Object>> columns, String name) {
        return findColumn(columns, name) != null;
    }

    private Map<String, Object> findColumn(List<Map<String, Object>> columns, String name) {
        for (Map<String, Object> column : columns) {
            if (name.equalsIgnoreCase(String.valueOf(column.get("name")))) {
                return column;
            }
        }
        return null;
    }

    private Map<String, Object> findOwnerColumn(List<Map<String, Object>> columns) {
        for (Map<String, Object> column : columns) {
            if (isOwnerColumn(column)) {
                return column;
            }
        }
        return null;
    }

    private Map<String, Object> findTenantColumn(List<Map<String, Object>> columns) {
        for (Map<String, Object> column : columns) {
            if (isTenantColumn(column)) {
                return column;
            }
        }
        return null;
    }

    private Map<String, Object> findClipConfigColumn(List<Map<String, Object>> columns) {
        for (Map<String, Object> column : columns) {
            if (isClipConfigColumn(column)) {
                return column;
            }
        }
        return null;
    }

    private boolean isOwnerColumn(Map<String, Object> column) {
        return isOwnerColumn(String.valueOf(column.get("name")),
                String.valueOf(firstNonEmpty(column.get("label"), column.get("comment"))));
    }

    private boolean isOwnerColumn(String name, String text) {
        if (name == null) {
            return false;
        }
        String lowerName = name.toLowerCase();
        return "user_id".equals(lowerName)
                || "userid".equals(lowerName);
    }

    private boolean isTenantColumn(Map<String, Object> column) {
        return isTenantColumn(String.valueOf(column.get("name")),
                String.valueOf(firstNonEmpty(column.get("label"), column.get("comment"))));
    }

    private boolean isTenantColumn(String name, String text) {
        if (name == null) {
            return false;
        }
        String lowerName = name.toLowerCase();
        String labelText = text == null ? "" : text;
        return labelText.contains("所属租户")
                || labelText.contains("租户标识")
                || "tenant_id".equals(lowerName)
                || "tenantid".equals(lowerName);
    }

    private boolean isClipConfigColumn(Map<String, Object> column) {
        return isClipConfigColumn(String.valueOf(column.get("name")),
                String.valueOf(firstNonEmpty(column.get("label"), column.get("comment"))));
    }

    private boolean isClipConfigColumn(String name, String text) {
        if (name == null) {
            return false;
        }
        String lowerName = name.toLowerCase();
        String labelText = text == null ? "" : text;
        return "clip_config_id".equals(lowerName)
                || "clipconfigid".equals(lowerName)
                || labelText.contains("关联剪辑配置")
                || labelText.contains("剪辑配置id")
                || labelText.contains("剪辑配置ID");
    }

    private boolean isSelectionStrategyColumn(Map<String, Object> column) {
        return isSelectionStrategyColumn(String.valueOf(column.get("name")),
                String.valueOf(firstNonEmpty(column.get("label"), column.get("comment"))));
    }

    private boolean isSelectionStrategyColumn(String name, String text) {
        if (name == null) {
            return false;
        }
        String lowerName = name.toLowerCase();
        String labelText = text == null ? "" : text;
        return "selection_strategy_id".equals(lowerName)
                || "selectionstrategyid".equals(lowerName)
                || "strategy_id".equals(lowerName)
                || labelText.contains("选品策略id")
                || labelText.contains("选品策略ID")
                || labelText.contains("策略id")
                || labelText.contains("策略ID");
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
}
