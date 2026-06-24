package com.lu.admin.modules.publish.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.publish.dto.PublishConfigQueryRequest;
import com.lu.admin.modules.publish.dto.PublishConfigRequest;
import com.lu.admin.modules.publish.service.PublishConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/publish/config", "/publish/strategy"})
public class PublishConfigController {

    @Autowired
    private PublishConfigService publishConfigService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<PublishConfigQueryRequest> queryPage) {
        return new ObjectRestResponse().data(publishConfigService.page(queryPage.getCurrent(), queryPage.getSize()));
    }

    @GetMapping("/columns")
    public ObjectRestResponse columns() {
        return new ObjectRestResponse().data(publishConfigService.columns());
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        return new ObjectRestResponse().data(publishConfigService.list());
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody PublishConfigRequest publishConfig) {
        publishConfigService.create(publishConfig == null ? null : publishConfig.toMap());
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody PublishConfigRequest publishConfig) {
        publishConfigService.update(publishConfig == null ? null : publishConfig.toMap());
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody PublishConfigRequest publishConfig) {
        publishConfigService.delete(publishConfig == null ? null : publishConfig.toMap());
        return new ObjectRestResponse();
    }
}
