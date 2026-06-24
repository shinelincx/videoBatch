package com.lu.admin.modules.editing.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.editing.entity.ClipEditing;
import com.lu.admin.modules.editing.service.ClipEditingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/editing/clip")
public class ClipEditingController {

    @Autowired
    private ClipEditingService clipEditingService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<ClipEditing> queryPage) {
        return new ObjectRestResponse().data(clipEditingService.page(
            queryPage.createPage().convert(m -> m)));
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody ClipEditing clipEditing) {
        clipEditingService.save(clipEditing);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody ClipEditing clipEditing) {
        clipEditingService.updateById(clipEditing);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody ClipEditing clipEditing) {
        clipEditingService.removeById(clipEditing.getId());
        return new ObjectRestResponse();
    }
}