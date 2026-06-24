package com.lu.admin.modules.clip.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.clip.entity.ClipConfig;
import com.lu.admin.modules.clip.service.ClipConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/clip_config")
public class ClipConfigController {

    @Autowired
    private ClipConfigService clipConfigService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<ClipConfig> queryPage) {
        clipConfigService.ensureTableShape();
        Page<ClipConfig> page = queryPage.createPage();
        QueryWrapper<ClipConfig> wrapper = buildQueryWrapper(queryPage.getParams());
        return new ObjectRestResponse().data(clipConfigService.page(page, wrapper));
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        clipConfigService.ensureTableShape();
        List<ClipConfig> list = clipConfigService.list(TenantUtils.filter(new QueryWrapper<ClipConfig>())
                .orderByDesc("id"));
        return new ObjectRestResponse().data(list);
    }

    @GetMapping("/config_map")
    public ObjectRestResponse configMap() {
        return new ObjectRestResponse().data(clipConfigService.configMap());
    }

    @GetMapping({"/getById", "/get_by_id"})
    public ObjectRestResponse getById(@RequestParam Long id) {
        clipConfigService.ensureTableShape();
        if (id == null) {
            throw new BizException("剪辑配置ID不能为空");
        }
        ClipConfig config = clipConfigService.getOne(TenantUtils.filter(new QueryWrapper<ClipConfig>())
                .eq("id", id)
                .last("limit 1"));
        if (config == null) {
            throw new BizException("剪辑配置不存在或无权限");
        }
        return new ObjectRestResponse().data(config);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody ClipConfig clipConfig) {
        clipConfigService.createConfig(clipConfig);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody ClipConfig clipConfig) {
        clipConfigService.updateConfig(clipConfig);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody ClipConfig clipConfig) {
        clipConfigService.deleteConfig(clipConfig == null ? null : clipConfig.getId());
        return new ObjectRestResponse();
    }

    private QueryWrapper<ClipConfig> buildQueryWrapper(ClipConfig params) {
        QueryWrapper<ClipConfig> wrapper = TenantUtils.filter(new QueryWrapper<ClipConfig>());
        if (params != null) {
            if (hasText(params.getCode())) {
                wrapper.like("code", params.getCode().trim());
            }
            if (hasText(params.getName())) {
                wrapper.like("name", params.getName().trim());
            }
            if (hasText(params.getClipMode())) {
                wrapper.eq("clip_mode", params.getClipMode().trim());
            }
            if (params.getStatus() != null) {
                wrapper.eq("status", params.getStatus());
            }
        }
        return wrapper.orderByDesc("id");
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
