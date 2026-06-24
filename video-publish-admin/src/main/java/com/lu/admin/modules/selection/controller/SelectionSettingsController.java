package com.lu.admin.modules.selection.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.selection.entity.SelectionSettings;
import com.lu.admin.modules.selection.service.SelectionSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/selection/settings")
public class SelectionSettingsController {

    @Autowired
    private SelectionSettingsService selectionSettingsService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<SelectionSettings> queryPage) {
        return new ObjectRestResponse().data(selectionSettingsService.page(
            queryPage.createPage().convert(m -> m)));
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody SelectionSettings selectionSettings) {
        selectionSettingsService.save(selectionSettings);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody SelectionSettings selectionSettings) {
        selectionSettingsService.updateById(selectionSettings);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody SelectionSettings selectionSettings) {
        selectionSettingsService.removeById(selectionSettings.getId());
        return new ObjectRestResponse();
    }
}
