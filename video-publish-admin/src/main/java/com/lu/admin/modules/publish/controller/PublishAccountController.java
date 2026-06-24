package com.lu.admin.modules.publish.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.publish.dto.PublishAccountImportRequest;
import com.lu.admin.modules.publish.dto.PublishAccountLoginRequest;
import com.lu.admin.modules.publish.dto.PublishAccountQueryRequest;
import com.lu.admin.modules.publish.dto.PublishAccountRequest;
import com.lu.admin.modules.publish.dto.PublishAccountStartPublishRequest;
import com.lu.admin.modules.publish.dto.PublishAccountStatusRequest;
import com.lu.admin.modules.publish.dto.PublishAccountTaskRequest;
import com.lu.admin.modules.publish.service.PublishAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/publish/account")
public class PublishAccountController {

    @Autowired
    private PublishAccountService publishAccountService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<PublishAccountQueryRequest> queryPage) {
        return new ObjectRestResponse().data(publishAccountService.page(queryPage.getCurrent(), queryPage.getSize()));
    }

    @GetMapping("/columns")
    public ObjectRestResponse columns() {
        return new ObjectRestResponse().data(publishAccountService.columns());
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        return new ObjectRestResponse().data(publishAccountService.list());
    }

    @GetMapping("/statistics")
    public ObjectRestResponse statistics() {
        return new ObjectRestResponse().data(publishAccountService.statistics());
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody PublishAccountRequest publishAccount) {
        publishAccountService.create(publishAccount == null ? null : publishAccount.toMap());
        return new ObjectRestResponse();
    }

    @PostMapping("/import")
    public ObjectRestResponse importAccounts(@RequestBody PublishAccountImportRequest body) {
        return new ObjectRestResponse().data("count", publishAccountService.importFromAccounts(body == null ? null : body.toMap()));
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody PublishAccountRequest publishAccount) {
        publishAccountService.update(publishAccount == null ? null : publishAccount.toMap());
        return new ObjectRestResponse();
    }

    @PostMapping("/sync/status")
    public ObjectRestResponse syncStatus(@RequestBody PublishAccountStatusRequest body) {
        publishAccountService.syncStatus(body == null ? null : body.toMap());
        return new ObjectRestResponse();
    }

    @PostMapping("/login")
    public ObjectRestResponse login(@RequestBody PublishAccountLoginRequest body) {
        return new ObjectRestResponse().data(publishAccountService.login(body));
    }

    @PostMapping("/start/publish")
    public ObjectRestResponse startPublish(@RequestBody PublishAccountStartPublishRequest body) {
        return new ObjectRestResponse().data(publishAccountService.startPublish(body));
    }

    @PostMapping("/start/selection")
    public ObjectRestResponse startSelection(@RequestBody PublishAccountTaskRequest body) {
        publishAccountService.startSelection(body == null ? null : body.toMap());
        return new ObjectRestResponse();
    }

    @PostMapping("/collect/categories")
    public ObjectRestResponse collectCategories(@RequestBody PublishAccountTaskRequest body) {
        publishAccountService.collectCategories(body == null ? null : body.toMap());
        return new ObjectRestResponse();
    }

    @PostMapping("/collect/categories/stop")
    public ObjectRestResponse stopCollectCategories(@RequestBody PublishAccountTaskRequest body) {
        publishAccountService.stopCollectCategories(body == null ? null : body.toMap());
        return new ObjectRestResponse();
    }

    @GetMapping("/task/poll")
    public ObjectRestResponse pollTask() {
        return new ObjectRestResponse().data(publishAccountService.pollTask());
    }

    @GetMapping("/pending_publish/matches")
    public ObjectRestResponse pendingPublishMatches(
            @RequestParam(value = "macAddress", required = false) String macAddress,
            @RequestParam(value = "mac_address", required = false) String macSnakeAddress) {
        String resolvedMacAddress = macAddress != null && !macAddress.trim().isEmpty()
                ? macAddress
                : macSnakeAddress;
        return new ObjectRestResponse().data(publishAccountService.matchPendingPublishProducts(resolvedMacAddress));
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody PublishAccountRequest publishAccount) {
        publishAccountService.delete(publishAccount == null ? null : publishAccount.toMap());
        return new ObjectRestResponse();
    }
}
