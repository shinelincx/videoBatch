package com.lu.admin.modules.baseconfig.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.baseconfig.dto.AccountLoginRequest;
import com.lu.admin.modules.baseconfig.entity.Account;
import com.lu.admin.modules.baseconfig.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/base/account")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final AtomicBoolean creatorCookieClearAttempted = new AtomicBoolean(false);

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<Account> queryPage) {
        ensureAccountColumns();
        Page<Account> page = queryPage.createPage();
        QueryWrapper<Account> wrapper = TenantUtils.filter(new QueryWrapper<Account>())
                .orderByAsc("priority")
                .orderByDesc("id");
        IPage<Account> result = accountService.page(page, wrapper);
        fillProductCategoryNames(result.getRecords());
        clearCreatorCookies(result.getRecords());
        return new ObjectRestResponse().data(result);
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        ensureAccountColumns();
        List<Account> list = accountService.list(TenantUtils.filter(new QueryWrapper<Account>())
                .orderByAsc("priority")
                .orderByDesc("id"));
        fillProductCategoryNames(list);
        clearCreatorCookies(list);
        return new ObjectRestResponse().data(list);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody Account account) {
        ensureAccountColumns();
        clearCreatorCookie(account);
        normalizeCode(account, true);
        validateUniqueCode(account);
        if (account.getTenantId() == null) {
            account.setTenantId(TenantUtils.currentTenantId());
        }
        validateProductCategoryId(account.getProductCategoryId());
        accountService.save(account);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody Account account) {
        ensureAccountColumns();
        clearCreatorCookie(account);
        normalizeCode(account, false);
        validateUniqueCode(account);
        if (TenantUtils.currentTenantId() != null) {
            account.setTenantId(TenantUtils.currentTenantId());
        }
        validateProductCategoryId(account.getProductCategoryId());
        QueryWrapper<Account> wrapper = TenantUtils.filter(new QueryWrapper<Account>())
                .eq("id", account.getId());
        accountService.update(account, wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody Account account) {
        ensureAccountColumns();
        if (account == null || account.getId() == null) {
            throw new BizException("账号ID不能为空");
        }
        ensureAccountNotReferencedByPublishAccount(account.getId());
        QueryWrapper<Account> wrapper = TenantUtils.filter(new QueryWrapper<Account>())
                .eq("id", account.getId());
        accountService.remove(wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/login")
    public ObjectRestResponse login(@RequestBody AccountLoginRequest body) {
        ensureAccountColumns();
        return new ObjectRestResponse().data(accountService.login(body));
    }

    private void ensureAccountColumns() {
        if (tableExists("account") && !tableHasColumn("account", "code")) {
            jdbcTemplate.execute("alter table `account` add column `code` varchar(40) null comment '编码' after `id`");
        }
        if (tableExists("account") && !tableHasColumn("account", "daily_max_publish_count")) {
            jdbcTemplate.execute("alter table `account` add column `daily_max_publish_count` int null default 0 comment '每日最大发布数'");
        }
        if (tableExists("account") && !tableHasColumn("account", "last_login_time")) {
            jdbcTemplate.execute("alter table `account` add column `last_login_time` datetime null default null comment '最近登录时间'");
        }
        clearStoredCreatorCookies();
    }

    private void normalizeCode(Account account, boolean required) {
        String code = account == null ? null : account.getCode();
        if (required && !StringUtils.hasText(code)) {
            throw new BizException("编码不能为空");
        }
        if (code != null) {
            if (!StringUtils.hasText(code)) {
                throw new BizException("编码不能为空");
            }
            account.setCode(code.trim());
        }
    }

    private void validateUniqueCode(Account account) {
        if (account == null || !StringUtils.hasText(account.getCode())) {
            return;
        }
        QueryWrapper<Account> wrapper = TenantUtils.filter(new QueryWrapper<Account>())
                .eq("code", account.getCode());
        if (account.getId() != null) {
            wrapper.ne("id", account.getId());
        }
        if (accountService.count(wrapper) > 0) {
            throw new BizException("编码已存在");
        }
    }

    private void fillProductCategoryNames(List<Account> accounts) {
        if (accounts == null || accounts.isEmpty()
                || !tableExists("product_category")
                || !tableHasColumn("product_category", "id")
                || !tableHasColumn("product_category", "name")) {
            return;
        }
        List<Long> ids = accounts.stream()
                .map(Account::getProductCategoryId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (ids.isEmpty()) {
            return;
        }

        String placeholders = ids.stream().map(id -> "?").collect(Collectors.joining(","));
        List<Object> args = new java.util.ArrayList<>(ids);
        String categoryFilter = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tableHasColumn("product_category", "deleted")) {
            categoryFilter += " and `deleted` = 0";
        }
        if (tenantId != null && tableHasColumn("product_category", "tenant_id")) {
            categoryFilter += " and `tenant_id` = ?";
            args.add(tenantId);
        }
        String sql = "select `id`, `name` from `product_category` where `id` in (" + placeholders + ")" + categoryFilter;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args.toArray());
        Map<Long, String> nameMap = new java.util.HashMap<>();
        for (Map<String, Object> row : rows) {
            Object categoryId = row.get("id");
            Object name = row.get("name");
            if (categoryId != null && name != null) {
                nameMap.put(Long.valueOf(String.valueOf(categoryId)), String.valueOf(name));
            }
        }
        accounts.forEach(account -> {
            String categoryName = nameMap.get(account.getProductCategoryId());
            if (categoryName != null) {
                account.setProductCategoryName(categoryName);
            }
        });
    }

    private void clearCreatorCookies(List<Account> accounts) {
        if (accounts == null || accounts.isEmpty()) {
            return;
        }
        accounts.forEach(this::clearCreatorCookie);
    }

    private void clearCreatorCookie(Account account) {
        if (account != null) {
            account.setCreatorCookie(null);
        }
    }

    private void clearStoredCreatorCookies() {
        if (!creatorCookieClearAttempted.compareAndSet(false, true)) {
            return;
        }
        if (tableExists("account") && tableHasColumn("account", "creator_cookie")) {
            jdbcTemplate.update("update `account` set `creator_cookie` = null where `creator_cookie` is not null");
        }
    }

    private void validateProductCategoryId(Long productCategoryId) {
        if (productCategoryId == null || productCategoryId <= 0
                || !tableExists("product_category")
                || !tableHasColumn("product_category", "id")) {
            return;
        }
        List<Object> args = new java.util.ArrayList<>();
        args.add(productCategoryId);
        String deletedFilter = tableHasColumn("product_category", "deleted") ? " and `deleted` = 0" : "";
        String tenantFilter = "";
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("product_category", "tenant_id")) {
            tenantFilter = " and `tenant_id` = ?";
            args.add(tenantId);
        }
        String existsSql = "select count(1) from `product_category` where `id` = ?"
                + deletedFilter + tenantFilter;
        Number existsCount = jdbcTemplate.queryForObject(existsSql, args.toArray(), Number.class);
        if (existsCount == null || existsCount.longValue() == 0) {
            throw new BizException("商品类目不存在或已被删除");
        }
    }

    private void ensureAccountNotReferencedByPublishAccount(Long accountId) {
        if (accountId == null || !tableExists("publish_account")) {
            return;
        }
        List<String> accountColumns = new ArrayList<>();
        if (tableHasColumn("publish_account", "account_id")) {
            accountColumns.add("account_id");
        }
        if (tableHasColumn("publish_account", "source_account_id")) {
            accountColumns.add("source_account_id");
        }
        if (tableHasColumn("publish_account", "base_account_id")) {
            accountColumns.add("base_account_id");
        }
        if (accountColumns.isEmpty()) {
            return;
        }

        List<Object> args = new ArrayList<>();
        List<String> referenceFilters = new ArrayList<>();
        for (String column : accountColumns) {
            referenceFilters.add("`" + column + "` = ?");
            args.add(accountId);
        }
        String referenceFilter = String.join(" or ", referenceFilters);
        String sql = "select count(1) from `publish_account` where (" + referenceFilter + ")";
        if (tableHasColumn("publish_account", "deleted")) {
            sql += " and ifnull(`deleted`, 0) = 0";
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn("publish_account", "tenant_id")) {
            sql += " and `tenant_id` = ?";
            args.add(tenantId);
        }

        Number referenceCount = jdbcTemplate.queryForObject(sql, args.toArray(), Number.class);
        if (referenceCount != null && referenceCount.longValue() > 0) {
            throw new BizException("该账号已被发布账号引用，禁止删除");
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
}
