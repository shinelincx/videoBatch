package com.lu.admin.modules.editing.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.editing.entity.MixedEditing;
import com.lu.admin.modules.editing.service.MixedEditingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/editing/mixed")
public class MixedEditingController {

    @Autowired
    private MixedEditingService mixedEditingService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<MixedEditing> queryPage) {
        return new ObjectRestResponse().data(mixedEditingService.page(
            queryPage.createPage().convert(m -> m)));
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody MixedEditing mixedEditing) {
        mixedEditingService.save(mixedEditing);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody MixedEditing mixedEditing) {
        mixedEditingService.updateById(mixedEditing);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody MixedEditing mixedEditing) {
        mixedEditingService.removeById(mixedEditing.getId());
        return new ObjectRestResponse();
    }
}