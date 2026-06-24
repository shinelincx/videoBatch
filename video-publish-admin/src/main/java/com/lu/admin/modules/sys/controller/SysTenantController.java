package com.lu.admin.modules.sys.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.modules.sys.dto.SysTenantDeleteRequest;
import com.lu.admin.modules.sys.dto.SysTenantQueryRequest;
import com.lu.admin.modules.sys.entity.SysTenant;
import com.lu.admin.modules.sys.service.SysTenantBiz;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
@RequestMapping("/sys_tenant")
public class SysTenantController {

    @Autowired
    private SysTenantBiz tenantService;

    @PostMapping
    public ObjectRestResponse add(@RequestBody SysTenant tenant) {
        if (tenant == null || ObjectUtils.isEmpty(tenant.getName())) {
            throw new BizException("租户名称不能为空");
        }
        SysTenant tenantDB = tenantService.getOne(new QueryWrapper<SysTenant>().eq("name", tenant.getName()));
        if (tenantDB != null) {
            throw new BizException("租户已存在：" + tenant.getName());
        }

        tenant.setId(IdWorker.getId());
        tenant.setCreateTime(new Date());
        tenant.setDeleted(0);
        tenantService.save(tenant);
        return new ObjectRestResponse()
                .data("tid", tenant.getTid())
                .data("created", tenant.getCreateTime());
    }

    @DeleteMapping
    public ObjectRestResponse delete(@RequestBody SysTenantDeleteRequest request) {
        Long id = request == null ? null : request.tenantId();
        if (id == null) {
            throw new BizException("无法删除租户：参数为空（租户id）");
        }
        boolean success = tenantService.removeById(id);
        return new ObjectRestResponse().data(success);
    }

    @PostMapping("/query")
    public ObjectRestResponse query(@RequestBody SysTenantQueryRequest request) {
        String name = request == null ? null : request.queryName();
        int current = request == null ? 1 : request.pageCurrent();
        int size = request == null ? 10 : request.pageSize();

        QueryWrapper<SysTenant> queryParams = new QueryWrapper<>();
        if (!ObjectUtils.isEmpty(name)) {
            queryParams.like("name", name);
        }
        queryParams.orderByDesc("create_time").orderByDesc("id");
        IPage<SysTenant> page = tenantService.page(new Page<>(current, size), queryParams);
        return new ObjectRestResponse().data("page", page);
    }

    @PatchMapping("/info")
    public ObjectRestResponse update(@RequestBody SysTenant tenant) {
        if (tenant == null || tenant.getId() == null) {
            throw new BizException("无法更新租户：参数为空（租户id）");
        }
        if (ObjectUtils.isEmpty(tenant.getName())) {
            throw new BizException("租户名称不能为空");
        }
        tenant.setUpdateTime(new Date());
        tenant.setCreateTime(null);
        tenant.setDeleted(null);
        tenantService.updateById(tenant);
        return new ObjectRestResponse().data("updated", tenant.getUpdateTime());
    }
}
