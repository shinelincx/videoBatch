package com.lu.admin.modules.baseconfig.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.baseconfig.entity.ProxyConfig;
import com.lu.admin.modules.baseconfig.service.ProxyConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/base/proxy")
public class ProxyConfigController {

    @Autowired
    private ProxyConfigService proxyConfigService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<ProxyConfig> queryPage) {
        Page<ProxyConfig> page = queryPage.createPage();
        QueryWrapper<ProxyConfig> wrapper = TenantUtils.filter(new QueryWrapper<ProxyConfig>())
                .orderByDesc("id");
        return new ObjectRestResponse().data(proxyConfigService.page(page, wrapper));
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        List<ProxyConfig> list = proxyConfigService.list(TenantUtils.filter(new QueryWrapper<ProxyConfig>())
                .orderByDesc("id"));
        return new ObjectRestResponse().data(list);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody ProxyConfig proxyConfig) {
        if (proxyConfig.getTenantId() == null) {
            proxyConfig.setTenantId(TenantUtils.currentTenantId());
        }
        proxyConfigService.save(proxyConfig);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody ProxyConfig proxyConfig) {
        if (TenantUtils.currentTenantId() != null) {
            proxyConfig.setTenantId(TenantUtils.currentTenantId());
        }
        QueryWrapper<ProxyConfig> wrapper = TenantUtils.filter(new QueryWrapper<ProxyConfig>())
                .eq("id", proxyConfig.getId());
        proxyConfigService.update(proxyConfig, wrapper);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody ProxyConfig proxyConfig) {
        QueryWrapper<ProxyConfig> wrapper = TenantUtils.filter(new QueryWrapper<ProxyConfig>())
                .eq("id", proxyConfig.getId());
        proxyConfigService.remove(wrapper);
        return new ObjectRestResponse();
    }
}
