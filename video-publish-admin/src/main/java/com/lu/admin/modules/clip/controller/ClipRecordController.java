package com.lu.admin.modules.clip.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.clip.entity.ClipRecord;
import com.lu.admin.modules.clip.service.ClipRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/clip_record")
public class ClipRecordController {

    @Autowired
    private ClipRecordService clipRecordService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<ClipRecord> queryPage) {
        return new ObjectRestResponse().data(clipRecordService.pageWithSelectionInfo(queryPage.createPage(), queryPage.getParams()));
    }

    @GetMapping("/pending_clip/list")
    public ObjectRestResponse pendingClipList() {
        return new ObjectRestResponse().data(clipRecordService.listPendingClipWithSelectionInfo());
    }

    @GetMapping("/statistics")
    public ObjectRestResponse statistics() {
        return new ObjectRestResponse().data(clipRecordService.statistics());
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody ClipRecord clipRecord) {
        clipRecordService.ensureTableShape();
        clipRecordService.removeById(clipRecord.getId());
        return new ObjectRestResponse();
    }
}
