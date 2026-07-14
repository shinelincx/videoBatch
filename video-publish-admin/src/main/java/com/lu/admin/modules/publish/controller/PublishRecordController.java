package com.lu.admin.modules.publish.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.publish.dto.PublishRecordCreateRequest;
import com.lu.admin.modules.publish.dto.PublishRecordQueryRequest;
import com.lu.admin.modules.publish.dto.PublishRecordStatusUpdateRequest;
import com.lu.admin.modules.publish.service.PublishAccountService;
import com.lu.admin.modules.publish.service.PublishRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/publish/record")
public class PublishRecordController {

    @Autowired
    private PublishRecordService publishRecordService;

    @Autowired
    private PublishAccountService publishAccountService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<PublishRecordQueryRequest> queryPage) {
        return new ObjectRestResponse().data(publishRecordService.page(queryPage.getCurrent(), queryPage.getSize()));
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        return new ObjectRestResponse().data(publishRecordService.list());
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody PublishRecordCreateRequest request) {
        if (request == null) {
            request = new PublishRecordCreateRequest();
        }
        return new ObjectRestResponse().data(publishRecordService.create(request.getProductId(), request.getAccountId()));
    }

    @PostMapping("/update_status")
    @Transactional(rollbackFor = Exception.class)
    public ObjectRestResponse updateStatus(@RequestBody PublishRecordStatusUpdateRequest request) {
        if (request == null) {
            request = new PublishRecordStatusUpdateRequest();
        }
        Map<String, Object> result = publishRecordService.updateStatus(request.getId(), request.getStatus(), request.getReason());
        int publishAccountUpdated = Boolean.TRUE.equals(result.get("successTransition"))
                ? publishAccountService.incrementTodayPublishCount(numberToLong(result.get("accountId")))
                : 0;
        result.put("publishAccountUpdated", publishAccountUpdated);
        return new ObjectRestResponse().data(result);
    }

    private Long numberToLong(Object value) {
        return value instanceof Number ? ((Number) value).longValue() : null;
    }
}
