package com.lu.admin.modules.selection.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.clip.entity.ClipRecord;
import com.lu.admin.modules.clip.service.ClipRecordService;
import com.lu.admin.modules.publish.service.PublishAccountService;
import com.lu.admin.modules.publish.service.PublishRecordService;
import com.lu.admin.modules.selection.dto.SelectionRecordBatchRequest;
import com.lu.admin.modules.selection.dto.SelectionRecordExistsRequest;
import com.lu.admin.modules.selection.dto.SelectionRecordProductIdRequest;
import com.lu.admin.modules.selection.dto.SelectionRecordSearchDto;
import com.lu.admin.modules.selection.dto.SelectionRecordStatusUpdateRequest;
import com.lu.admin.modules.selection.dto.SelectionRecordVideoContentRequest;
import com.lu.admin.modules.selection.entity.SelectionRecord;
import com.lu.admin.modules.selection.service.SelectionRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/selection/record")
public class SelectionRecordController {

    private static final String STATUS_DISCARDED = "已作废";
    private static final String STATUS_PENDING_CONFIG = "待配置";
    private static final String STATUS_PENDING_CLIP = "待剪辑";
    private static final String STATUS_CLIPPING = "剪辑中";
    private static final String STATUS_CLIP_FAILED = "剪辑失败";
    private static final String STATUS_PENDING_PUBLISH = "待发布";
    private static final String STATUS_PUBLISHING = "发布中";
    private static final String STATUS_PUBLISH_FAILED = "发布失败";
    private static final String STATUS_PUBLISH_SUCCESS = "发布成功";
    private static final Set<String> SELECTION_STATUSES = new LinkedHashSet<>(Arrays.asList(
            STATUS_DISCARDED,
            STATUS_PENDING_CONFIG,
            STATUS_PENDING_CLIP,
            STATUS_CLIPPING,
            STATUS_CLIP_FAILED,
            STATUS_PENDING_PUBLISH,
            STATUS_PUBLISHING,
            STATUS_PUBLISH_FAILED,
            STATUS_PUBLISH_SUCCESS));
    private static final Set<String> CLIP_ALLOWED_STATUSES = new LinkedHashSet<>(Arrays.asList(STATUS_PENDING_CONFIG));
    private static final Set<String> DISCARD_ALLOWED_STATUSES = new LinkedHashSet<>(
            Arrays.asList(STATUS_PENDING_CONFIG, STATUS_PENDING_CLIP, STATUS_CLIP_FAILED, STATUS_PENDING_PUBLISH));
    private static final Set<String> RESTORE_ALLOWED_STATUSES = new LinkedHashSet<>(
            Arrays.asList(STATUS_CLIP_FAILED, STATUS_PUBLISH_FAILED));

    @Autowired
    private SelectionRecordService selectionRecordService;

    @Autowired
    private ClipRecordService clipRecordService;

    @Autowired
    private PublishAccountService publishAccountService;

    @Autowired
    private PublishRecordService publishRecordService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile boolean selectionRecordColumnsReady = false;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<SelectionRecordSearchDto> queryPage) {
        ensureSelectionRecordColumns();
        Page<SelectionRecord> page = queryPage.createPage();
        QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .orderByDesc("id");
        SelectionRecordSearchDto params = queryPage.getParams();
        if (params != null) {
            boolean hasProductId = hasText(params.getProductId());
            boolean hasProductLink = hasText(params.getProductLink());
            if (hasProductId && hasProductLink) {
                wrapper.and(item -> item.eq("product_id", params.getProductId().trim())
                        .or()
                        .eq("product_link", params.getProductLink().trim()));
            } else if (hasProductId) {
                wrapper.eq("product_id", params.getProductId().trim());
            } else if (hasProductLink) {
                wrapper.eq("product_link", params.getProductLink().trim());
            }
            if (hasText(params.getProductTitle())) {
                wrapper.like("product_title", params.getProductTitle().trim());
            }
            if (hasText(params.getAccountNickname())) {
                wrapper.like("account_nickname", params.getAccountNickname().trim());
            }
            if (hasText(params.getStatus())) {
                wrapper.eq("status", params.getStatus().trim());
            }
            if (params.getStartTime() != null) {
                wrapper.ge("create_time", params.getStartTime());
            }
            if (params.getEndTime() != null) {
                wrapper.le("create_time", params.getEndTime());
            }
        }
        return new ObjectRestResponse().data(selectionRecordService.page(page, wrapper));
    }

    @PostMapping("/create")
    @Transactional(rollbackFor = Exception.class)
    public ObjectRestResponse create(@RequestBody SelectionRecord selectionRecord) {
        ensureSelectionRecordColumns();
        if (selectionRecord == null) {
            throw new BizException("请求参数不能为空");
        }
        Long accountId = resolveSelectionAccountId(selectionRecord);
        if (selectionRecord.getAccountId() == null) {
            selectionRecord.setAccountId(accountId);
        }
        String status = normalizeSelectionStatus(selectionRecord.getStatus());
        if (STATUS_PENDING_CONFIG.equals(status) && isSelectionAuditDisabledByAccountId(accountId)) {
            status = STATUS_PENDING_CLIP;
        }
        selectionRecord.setStatus(status);
        if (selectionRecord.getTenantId() == null) {
            selectionRecord.setTenantId(TenantUtils.currentTenantId());
        }
        selectionRecordService.save(selectionRecord);
        boolean clipRecordCreated = false;
        if (STATUS_PENDING_CLIP.equals(status)) {
            clipRecordCreated = clipRecordService.createPendingClipRecordIfAbsent(selectionRecord.getProductId());
        }
        return new ObjectRestResponse()
                .data("id", selectionRecord.getId())
                .data("status", status)
                .data("clipRecordCreated", clipRecordCreated);
    }

    @PostMapping("/exists")
    public ObjectRestResponse exists(@RequestBody SelectionRecordExistsRequest request) {
        ensureSelectionRecordColumns();
        String productId = request == null ? null : request.getProductId();
        boolean exists = false;
        if (hasText(productId)) {
            QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                    .eq("product_id", productId.trim());
            exists = selectionRecordService.count(wrapper) > 0;
        }
        return new ObjectRestResponse()
                .data("exists", exists)
                .data("productId", productId);
    }

    @PostMapping("/detail_by_product_id")
    public ObjectRestResponse detailByProductId(@RequestBody SelectionRecordProductIdRequest request) {
        ensureSelectionRecordColumns();
        if (request == null || !hasText(request.getProductId())) {
            throw new BizException("商品ID不能为空");
        }
        String productId = request.getProductId().trim();
        QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .eq("product_id", productId)
                .orderByDesc("id")
                .last("limit 1");
        SelectionRecord record = selectionRecordService.getOne(wrapper);
        if (record == null) {
            throw new BizException("商品ID对应的选品记录不存在或无权限");
        }
        return new ObjectRestResponse().data(record);
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody SelectionRecord selectionRecord) {
        ensureSelectionRecordColumns();
        if (selectionRecord == null) {
            throw new BizException("请求参数不能为空");
        }
        if (selectionRecord.getAccountId() == null) {
            selectionRecord.setAccountId(resolveSelectionAccountId(selectionRecord));
        }
        selectionRecord.setStatus(normalizeSelectionStatus(selectionRecord.getStatus()));
        if (TenantUtils.currentTenantId() != null) {
            selectionRecord.setTenantId(TenantUtils.currentTenantId());
        }
        QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .eq("id", selectionRecord.getId());
        selectionRecordService.update(selectionRecord, wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/update_video_content_by_product_id")
    public ObjectRestResponse updateVideoContentByProductId(@RequestBody SelectionRecordVideoContentRequest request) {
        ensureSelectionRecordColumns();
        if (request == null || !hasText(request.getProductId())) {
            throw new BizException("商品ID不能为空");
        }

        String productId = request.getProductId().trim();
        QueryWrapper<SelectionRecord> countWrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .eq("product_id", productId);
        long count = selectionRecordService.count(countWrapper);
        if (count <= 0) {
            throw new BizException("商品ID对应的选品记录不存在或无权限");
        }
        if (hasText(request.getVideoTitle())
                || hasText(request.getVideoCopy())
                || hasText(request.getVideoTopic())) {
            SelectionRecord update = new SelectionRecord();
            update.setVideoTitle(normalizeOptionalText(request.getVideoTitle()));
            update.setVideoCopy(normalizeOptionalText(request.getVideoCopy()));
            update.setVideoTopic(normalizeOptionalText(request.getVideoTopic()));
            QueryWrapper<SelectionRecord> updateWrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                    .eq("product_id", productId);
            selectionRecordService.update(update, updateWrapper);
        }

        return new ObjectRestResponse()
                .data("productId", productId)
                .data("videoTitle", request.getVideoTitle())
                .data("videoCopy", request.getVideoCopy())
                .data("videoTopic", request.getVideoTopic());
    }

    @PostMapping("/update_status_by_product_id")
    @Transactional(rollbackFor = Exception.class)
    public ObjectRestResponse updateStatusByProductId(@RequestBody SelectionRecordStatusUpdateRequest request) {
        ensureSelectionRecordColumns();
        if (request == null) {
            throw new BizException("请求参数不能为空");
        }
        if (!hasText(request.getProductId())) {
            throw new BizException("商品ID不能为空");
        }
        if (!hasText(request.getStatus())) {
            throw new BizException("状态不能为空");
        }
        String status = normalizeSelectionStatus(request.getStatus());
        if (!SELECTION_STATUSES.contains(status)) {
            throw new BizException("状态只允许为" + String.join("、", SELECTION_STATUSES));
        }
        if (STATUS_PUBLISH_SUCCESS.equals(status) && request.getAccountId() == null) {
            throw new BizException("发布成功时账号ID不能为空");
        }
        String reason = normalizeReason(request.getReason());
        if (isFailedStatus(status) && !hasText(reason)) {
            throw new BizException("失败状态必须提交原因");
        }

        String productId = request.getProductId().trim();
        QueryWrapper<SelectionRecord> countWrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .eq("product_id", productId);
        long count = selectionRecordService.count(countWrapper);
        if (count <= 0) {
            throw new BizException("商品ID对应的选品记录不存在或无权限");
        }

        SelectionRecord update = new SelectionRecord();
        update.setStatus(status);
        update.setReason(isFailedStatus(status) ? reason : null);
        QueryWrapper<SelectionRecord> updateWrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .eq("product_id", productId);
        selectionRecordService.update(update, updateWrapper);
        int publishAccountUpdated = STATUS_PUBLISH_SUCCESS.equals(status)
                ? publishAccountService.incrementTodayPublishCount(request.getAccountId())
                : 0;
        int publishRecordUpdated = publishRecordService.updateStatusByProductAndAccount(productId, request.getAccountId(), status, reason);
        return new ObjectRestResponse()
                .data("productId", productId)
                .data("accountId", request.getAccountId())
                .data("status", status)
                .data("reason", reason)
                .data("count", count)
                .data("publishAccountUpdated", publishAccountUpdated)
                .data("publishRecordUpdated", publishRecordUpdated);
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody SelectionRecord selectionRecord) {
        ensureSelectionRecordColumns();
        QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .eq("id", selectionRecord.getId());
        selectionRecordService.remove(wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/batch_clip")
    @Transactional(rollbackFor = Exception.class)
    public ObjectRestResponse batchClip(@RequestBody SelectionRecordBatchRequest request) {
        ensureSelectionRecordColumns();
        clipRecordService.ensureTableShape();
        List<SelectionRecord> records = selectedRecords(request);
        validateStatuses(records, CLIP_ALLOWED_STATUSES, "开始剪辑");

        List<ClipRecord> clipRecords = new ArrayList<>();
        for (SelectionRecord record : records) {
            ClipRecord clipRecord = new ClipRecord();
            clipRecord.setProductId(record.getProductId());
            clipRecords.add(clipRecord);
        }
        clipRecordService.saveBatch(clipRecords);
        for (SelectionRecord record : records) {
            SelectionRecord update = new SelectionRecord();
            update.setStatus(STATUS_PENDING_CLIP);
            QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                    .eq("id", record.getId());
            selectionRecordService.update(update, wrapper);
        }
        return new ObjectRestResponse().data("count", clipRecords.size());
    }

    @PostMapping("/batch_discard")
    @Transactional(rollbackFor = Exception.class)
    public ObjectRestResponse batchDiscard(@RequestBody SelectionRecordBatchRequest request) {
        ensureSelectionRecordColumns();
        List<SelectionRecord> records = selectedRecords(request);
        validateStatuses(records, DISCARD_ALLOWED_STATUSES, "作废");

        for (SelectionRecord record : records) {
            SelectionRecord update = new SelectionRecord();
            update.setStatus(STATUS_DISCARDED);
            QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                    .eq("id", record.getId());
            selectionRecordService.update(update, wrapper);
        }
        return new ObjectRestResponse().data("count", records.size());
    }

    @PostMapping("/batch_restore")
    @Transactional(rollbackFor = Exception.class)
    public ObjectRestResponse batchRestore(@RequestBody SelectionRecordBatchRequest request) {
        ensureSelectionRecordColumns();
        List<SelectionRecord> records = selectedRecords(request);
        validateStatuses(records, RESTORE_ALLOWED_STATUSES, "恢复");

        int pendingClipCount = 0;
        int pendingPublishCount = 0;
        for (SelectionRecord record : records) {
            String status = normalizeSelectionStatus(record.getStatus());
            String nextStatus = STATUS_CLIP_FAILED.equals(status) ? STATUS_PENDING_CLIP : STATUS_PENDING_PUBLISH;
            if (STATUS_PENDING_CLIP.equals(nextStatus)) {
                pendingClipCount++;
            } else {
                pendingPublishCount++;
            }
            SelectionRecord update = new SelectionRecord();
            update.setStatus(nextStatus);
            QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                    .eq("id", record.getId());
            selectionRecordService.update(update, wrapper);
        }
        return new ObjectRestResponse()
                .data("count", records.size())
                .data("pendingClipCount", pendingClipCount)
                .data("pendingPublishCount", pendingPublishCount);
    }

    private synchronized void ensureSelectionRecordColumns() {
        if (selectionRecordColumnsReady) {
            return;
        }
        if (!tableExists("product_selection_records")) {
            return;
        }
        ensureColumn("account_id", "bigint null default null comment '选品的账号' after `id`");
        ensureColumn("account_nickname", "varchar(100) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '账号昵称'");
        ensureColumn("product_category_id", "bigint null default null comment '商品类目ID'");
        ensureColumn("product_id", "varchar(100) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '商品ID'");
        ensureColumn("product_title", "varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '商品标题'");
        ensureColumn("product_link", "text character set utf8mb4 collate utf8mb4_unicode_ci null comment '商品链接'");
        ensureColumn("trailer_link", "text character set utf8mb4 collate utf8mb4_unicode_ci null comment '挂车链接'");
        ensureColumn("commission", "decimal(18,4) null default null comment '佣金'");
        ensureColumn("commission_rate", "decimal(18,4) null default null comment '佣金率'");
        ensureColumn("price", "decimal(18,4) null default null comment '价格'");
        ensureColumn("product_rating", "decimal(18,4) null default null comment '商品评分'");
        ensureColumn("total_sales", "int null default null comment '总销量'");
        ensureColumn("seller_count", "int null default null comment '带货人数'");
        ensureColumn("shop_name", "varchar(200) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '商铺名称'");
        ensureColumn("video_title", "varchar(255) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '视频标题'");
        ensureColumn("video_copy", "text character set utf8mb4 collate utf8mb4_unicode_ci null comment '视频文案'");
        ensureColumn("video_topic", "text character set utf8mb4 collate utf8mb4_unicode_ci null comment '视频话题'");
        ensureColumn("status", "varchar(50) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '状态：已作废、待配置、待剪辑、剪辑中、剪辑失败、待发布、发布中、发布失败、发布成功'");
        ensureColumn("reason", "varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '原因'");
        ensureColumn("tenant_id", "bigint null default null comment '租户标识'");

        modifyColumn("product_link", "text character set utf8mb4 collate utf8mb4_unicode_ci null comment '商品链接'");
        modifyColumn("trailer_link", "text character set utf8mb4 collate utf8mb4_unicode_ci null comment '挂车链接'");
        modifyColumn("product_title", "varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '商品标题'");
        modifyColumn("commission", "decimal(18,4) null default null comment '佣金'");
        modifyColumn("commission_rate", "decimal(18,4) null default null comment '佣金率'");
        modifyColumn("price", "decimal(18,4) null default null comment '价格'");
        modifyColumn("product_rating", "decimal(18,4) null default null comment '商品评分'");
        modifyColumn("status", "varchar(50) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '状态：已作废、待配置、待剪辑、剪辑中、剪辑失败、待发布、发布中、发布失败、发布成功'");

        migrateAccountNickname();
        migrateAccountId();
        migrateProductCategoryId();
        migrateSelectionStatusValues();
        dropColumnIfExists("sales_ratio");
        dropColumnIfExists("selection_approver_uid");
        dropColumnIfExists("publish_approver_uid");
        dropColumnIfExists("selection_approver_user_id");
        dropColumnIfExists("publish_approver_user_id");
        selectionRecordColumnsReady = true;
    }

    private void ensureColumn(String columnName, String columnDefinition) {
        if (!tableHasColumn("product_selection_records", columnName)) {
            jdbcTemplate.execute("alter table `product_selection_records` add column `" + columnName + "` " + columnDefinition);
        }
    }

    private void modifyColumn(String columnName, String columnDefinition) {
        if (tableHasColumn("product_selection_records", columnName)) {
            jdbcTemplate.execute("alter table `product_selection_records` modify column `" + columnName + "` " + columnDefinition);
        }
    }

    private void dropColumnIfExists(String columnName) {
        if (tableHasColumn("product_selection_records", columnName)) {
            jdbcTemplate.execute("alter table `product_selection_records` drop column `" + columnName + "`");
        }
    }

    private String normalizeOptionalText(String value) {
        if (!hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private void migrateAccountNickname() {
        if (!tableHasColumn("product_selection_records", "account_nickname")) {
            return;
        }
        if (tableHasColumn("product_selection_records", "selection_account_nickname")) {
            jdbcTemplate.update("update `product_selection_records` set `account_nickname` = `selection_account_nickname` " +
                    "where `account_nickname` is null and `selection_account_nickname` is not null");
        }
        if (tableHasColumn("product_selection_records", "account")) {
            jdbcTemplate.update("update `product_selection_records` set `account_nickname` = `account` " +
                    "where `account_nickname` is null and `account` is not null");
        }
        if (tableHasColumn("product_selection_records", "account_id")) {
            if (tableExists("account") && tableHasColumn("account", "id") && tableHasColumn("account", "nickname")) {
                jdbcTemplate.update("update `product_selection_records` psr left join `account` a on a.`id` = psr.`account_id` " +
                        "set psr.`account_nickname` = coalesce(a.`nickname`, cast(psr.`account_id` as char)) " +
                        "where psr.`account_nickname` is null and psr.`account_id` is not null");
            } else {
                jdbcTemplate.update("update `product_selection_records` set `account_nickname` = cast(`account_id` as char) " +
                        "where `account_nickname` is null and `account_id` is not null");
            }
        }
    }

    private void migrateAccountId() {
        if (!tableHasColumn("product_selection_records", "account_id")
                || !tableHasColumn("product_selection_records", "account_nickname")
                || !tableExists("account")
                || !tableHasColumn("account", "id")) {
            return;
        }
        String accountNicknameColumn = firstExistingTableColumn("account",
                "nickname", "nick_name", "nick", "account_name", "name");
        if (accountNicknameColumn == null) {
            return;
        }

        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("a.`" + accountNicknameColumn + "` is not null");
        clauses.add("trim(a.`" + accountNicknameColumn + "`) <> ''");
        appendCommonFilters("account", "a", clauses, args);
        jdbcTemplate.update("update `product_selection_records` psr join (" +
                        "select max(a.`id`) as `id`, trim(a.`" + accountNicknameColumn + "`) as `account_nickname` " +
                        "from `account` a where " + String.join(" and ", clauses) +
                        " group by trim(a.`" + accountNicknameColumn + "`)" +
                        ") matched on matched.`account_nickname` = trim(psr.`account_nickname`) " +
                        "set psr.`account_id` = matched.`id` " +
                        "where psr.`account_id` is null and psr.`account_nickname` is not null and trim(psr.`account_nickname`) <> ''",
                args.toArray());
    }

    private void migrateProductCategoryId() {
        if (!tableHasColumn("product_selection_records", "product_category_id")
                || !tableHasColumn("product_selection_records", "category")) {
            return;
        }
        jdbcTemplate.update("update `product_selection_records` set `product_category_id` = cast(`category` as unsigned) " +
                "where `product_category_id` is null and `category` regexp '^[0-9]+$'");
        if (tableExists("product_category")
                && tableHasColumn("product_category", "id")
                && tableHasColumn("product_category", "name")) {
            String deletedFilter = tableHasColumn("product_category", "deleted") ? " and ifnull(pc.`deleted`, 0) = 0" : "";
            jdbcTemplate.update("update `product_selection_records` psr join `product_category` pc on pc.`name` = psr.`category`" +
                    deletedFilter + " set psr.`product_category_id` = pc.`id` " +
                    "where psr.`product_category_id` is null and psr.`category` is not null and psr.`category` <> ''");
        }
    }

    private void migrateSelectionStatusValues() {
        if (!tableHasColumn("product_selection_records", "status")) {
            return;
        }
        jdbcTemplate.update("update `product_selection_records` set `status` = '待配置' " +
                "where `status` is null or trim(`status`) = ''");
        if (tableExists("clip_record") && tableHasColumn("clip_record", "product_id")
                && tableHasColumn("product_selection_records", "product_id")) {
            jdbcTemplate.update("update `product_selection_records` psr set psr.`status` = '待配置' " +
                    "where psr.`status` = '待剪辑' and not exists (" +
                    "select 1 from `clip_record` cr where cr.`product_id` = psr.`product_id`)");
        }
        jdbcTemplate.update("update `product_selection_records` set `status` = case `status` " +
                "when '选品审核中' then '待配置' " +
                "when '选品审核驳回' then '已作废' " +
                "when '剪辑审核中' then '待发布' " +
                "when '剪辑审核驳回' then '剪辑失败' " +
                "when '已发布' then '发布成功' " +
                "when '已废弃' then '已作废' " +
                "else `status` end " +
                "where `status` in ('选品审核中', '选品审核驳回', '剪辑审核中', '剪辑审核驳回', '已发布', '已废弃')");
    }

    private List<SelectionRecord> selectedRecords(SelectionRecordBatchRequest request) {
        List<Long> ids = request == null ? null : request.getIds();
        if (ids == null || ids.isEmpty()) {
            throw new BizException("请选择选品记录");
        }
        if (ids.stream().anyMatch(Objects::isNull)) {
            throw new BizException("所选记录ID不能为空");
        }
        List<Long> selectedIds = ids.stream().distinct().collect(Collectors.toList());
        QueryWrapper<SelectionRecord> wrapper = TenantUtils.filter(new QueryWrapper<SelectionRecord>())
                .in("id", selectedIds);
        List<SelectionRecord> records = selectionRecordService.list(wrapper);
        if (records.size() != selectedIds.size()) {
            throw new BizException("所选记录不存在或无权限");
        }
        return records;
    }

    private void validateStatuses(List<SelectionRecord> records, Set<String> allowedStatuses, String actionName) {
        for (SelectionRecord record : records) {
            String status = normalizeSelectionStatus(record.getStatus());
            if (!allowedStatuses.contains(status)) {
                throw new BizException(actionName + "操作只允许选择状态为" +
                        String.join("、", allowedStatuses) + "的数据");
            }
        }
    }

    private String normalizeSelectionStatus(String status) {
        if (!hasText(status)) {
            return STATUS_PENDING_CONFIG;
        }
        String value = status.trim();
        if ("选品审核中".equals(value)) return STATUS_PENDING_CONFIG;
        if ("选品审核驳回".equals(value) || "已废弃".equals(value)) return STATUS_DISCARDED;
        if ("剪辑审核中".equals(value)) return STATUS_PENDING_PUBLISH;
        if ("剪辑审核驳回".equals(value)) return STATUS_CLIP_FAILED;
        if ("发布失败".equals(value)) return STATUS_PUBLISH_FAILED;
        if ("已发布".equals(value)) return STATUS_PUBLISH_SUCCESS;
        return value;
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

    private Long resolveSelectionAccountId(SelectionRecord selectionRecord) {
        if (selectionRecord == null) {
            return null;
        }
        if (selectionRecord.getAccountId() != null) {
            return selectionRecord.getAccountId();
        }
        if (!tableExists("account")) {
            return null;
        }
        String accountNicknameColumn = firstExistingTableColumn("account",
                "nickname", "nick_name", "nick", "account_name", "name");
        if (!tableHasColumn("account", "id") || accountNicknameColumn == null) {
            return null;
        }
        String accountNickname = selectionRecord.getAccountNickname();
        return hasText(accountNickname) ? latestAccountIdByNickname(accountNickname.trim(), accountNicknameColumn) : null;
    }

    private boolean isSelectionAuditDisabledByAccountId(Long accountId) {
        if (accountId == null) {
            return false;
        }
        if (!tableExists("publish_account") || !tableExists("publish_config")) {
            return false;
        }

        String publishAccountColumn = firstExistingTableColumn("publish_account",
                "account_id", "source_account_id", "base_account_id");
        String configColumn = firstExistingTableColumn("publish_account",
                "config_id", "publish_config_id");
        if (publishAccountColumn == null || configColumn == null || !tableHasColumn("publish_config", "id")) {
            return false;
        }
        Long configId = latestPublishConfigIdByAccountId(accountId, publishAccountColumn, configColumn);
        if (configId == null || !tableHasColumn("publish_config", "selection_audit")) {
            return false;
        }

        Map<String, Object> config = latestPublishConfigById(configId);
        if (config.isEmpty()) {
            return false;
        }
        return !isSelectionAuditEnabled(firstValue(config, "selection_audit", "selectionAudit"));
    }

    private Long latestAccountIdByNickname(String accountNickname, String accountNicknameColumn) {
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("trim(`" + accountNicknameColumn + "`) = ?");
        args.add(accountNickname);
        appendCommonFilters("account", "a", clauses, args);
        String order = tableHasColumn("account", "id") ? " order by a.`id` desc" : "";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select a.`id` from `account` a where " + String.join(" and ", clauses) + order + " limit 1",
                args.toArray());
        return rows.isEmpty() ? null : longValue(firstValue(rows.get(0), "id"));
    }

    private Long latestPublishConfigIdByAccountId(Long accountId, String publishAccountColumn, String configColumn) {
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("pa.`" + publishAccountColumn + "` = ?");
        args.add(accountId);
        appendCommonFilters("publish_account", "pa", clauses, args);
        String order = tableHasColumn("publish_account", "id") ? " order by pa.`id` desc" : "";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select pa.`" + configColumn + "` as `config_id` from `publish_account` pa where " +
                        String.join(" and ", clauses) + order + " limit 1",
                args.toArray());
        return rows.isEmpty() ? null : longValue(firstValue(rows.get(0), "config_id"));
    }

    private Map<String, Object> latestPublishConfigById(Long configId) {
        List<Object> args = new ArrayList<>();
        List<String> clauses = new ArrayList<>();
        clauses.add("pc.`id` = ?");
        args.add(configId);
        appendCommonFilters("publish_config", "pc", clauses, args);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select pc.`selection_audit` from `publish_config` pc where " +
                        String.join(" and ", clauses) + " limit 1",
                args.toArray());
        return rows.isEmpty() ? java.util.Collections.emptyMap() : rows.get(0);
    }

    private void appendCommonFilters(String tableName, String alias, List<String> clauses, List<Object> args) {
        if (tableHasColumn(tableName, "deleted")) {
            clauses.add("ifnull(" + alias + ".`deleted`, 0) = 0");
        }
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null && tableHasColumn(tableName, "tenant_id")) {
            clauses.add(alias + ".`tenant_id` = ?");
            args.add(tenantId);
        }
    }

    private String firstExistingTableColumn(String tableName, String... columnNames) {
        for (String columnName : columnNames) {
            if (tableHasColumn(tableName, columnName)) {
                return columnName;
            }
        }
        return null;
    }

    private boolean isSelectionAuditEnabled(Object value) {
        if (value instanceof Number) {
            return ((Number) value).intValue() == 1;
        }
        String text = value == null ? "" : String.valueOf(value).trim();
        return "1".equals(text) || "true".equalsIgnoreCase(text) || "是".equals(text);
    }

    private Long longValue(Object value) {
        if (value == null) {
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

    private Object firstValue(Map<String, Object> row, String... keys) {
        for (String key : keys) {
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (key.equalsIgnoreCase(entry.getKey()) && entry.getValue() != null) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
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
