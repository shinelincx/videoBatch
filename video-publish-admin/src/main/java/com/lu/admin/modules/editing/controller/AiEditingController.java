package com.lu.admin.modules.editing.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.editing.entity.AiEditing;
import com.lu.admin.modules.editing.service.AiEditingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/editing/ai")
public class AiEditingController {

    @Autowired
    private AiEditingService aiEditingService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<AiEditing> queryPage) {
        return new ObjectRestResponse().data(aiEditingService.page(
            queryPage.createPage().convert(m -> m)));
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody AiEditing aiEditing) {
        aiEditingService.save(aiEditing);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody AiEditing aiEditing) {
        aiEditingService.updateById(aiEditing);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody AiEditing aiEditing) {
        aiEditingService.removeById(aiEditing.getId());
        return new ObjectRestResponse();
    }
}