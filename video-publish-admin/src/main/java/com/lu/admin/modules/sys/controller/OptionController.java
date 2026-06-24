package com.lu.admin.modules.sys.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.sys.entity.SysRole;
import com.lu.admin.modules.sys.service.SysRoleBiz;
import com.lu.admin.modules.sys.vo.Option;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/option")
public class OptionController {

    @Autowired
    private SysRoleBiz sysRoleService;

    @GetMapping("/role")
    public ObjectRestResponse listRoleOptions() {
        QueryWrapper<SysRole> params = new QueryWrapper<>();
        params.select("rid,rname,rval");
        List<SysRole> list = sysRoleService.list(params);
        List<Option> options = list.stream().map(obj -> new Option(obj.getRid(), obj.getRname(), obj.getRval())).collect(Collectors.toList());
        return new ObjectRestResponse().data("options", options);
    }
}
