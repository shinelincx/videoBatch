package com.lu.admin.modules.selection.controller;

import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.selection.entity.SelectionSource;
import com.lu.admin.modules.selection.service.SelectionSourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/selection/source")
public class SelectionSourceController {

    @Autowired
    private SelectionSourceService selectionSourceService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<SelectionSource> queryPage) {
        return new ObjectRestResponse().data(selectionSourceService.page(
            queryPage.createPage().convert(m -> m)));
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody SelectionSource selectionSource) {
        selectionSourceService.save(selectionSource);
        return new ObjectRestResponse();
    }

    @PostMapping("/update")
    public ObjectRestResponse update(@RequestBody SelectionSource selectionSource) {
        selectionSourceService.updateById(selectionSource);
        return new ObjectRestResponse();
    }

    @PostMapping("/delete")
    public ObjectRestResponse delete(@RequestBody SelectionSource selectionSource) {
        selectionSourceService.removeById(selectionSource.getId());
        return new ObjectRestResponse();
    }
}