package com.lu.admin.modules.baseconfig.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.baseconfig.dto.RobotCommandRequest;
import com.lu.admin.modules.baseconfig.dto.RobotRegisterRequest;
import com.lu.admin.modules.baseconfig.entity.Robot;
import com.lu.admin.modules.baseconfig.service.RobotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/base/robot")
public class RobotController {

    @Autowired
    private RobotService robotService;

    @PostMapping("/page")
    public ObjectRestResponse page(@RequestBody BasePage<Robot> queryPage) {
        Page<Robot> page = queryPage.createPage();
        QueryWrapper<Robot> wrapper = TenantUtils.filter(new QueryWrapper<Robot>())
                .orderByDesc("last_heartbeat_time")
                .orderByDesc("id");
        Page<Robot> result = robotService.page(page, wrapper);
        robotService.applyHeartbeatStatus(result.getRecords());
        robotService.fillTenantNames(result.getRecords());
        return new ObjectRestResponse().data(result);
    }

    @GetMapping("/list")
    public ObjectRestResponse list() {
        List<Robot> list = robotService.list(TenantUtils.filter(new QueryWrapper<Robot>())
                .orderByDesc("last_heartbeat_time")
                .orderByDesc("id"));
        robotService.applyHeartbeatStatus(list);
        robotService.fillTenantNames(list);
        return new ObjectRestResponse().data(list);
    }

    @GetMapping("/online")
    public ObjectRestResponse online() {
        return new ObjectRestResponse().data(robotService.listOnline());
    }

    @PostMapping("/register")
    public ObjectRestResponse register(@RequestBody RobotRegisterRequest request) {
        Robot robot = new Robot()
                .setMachineName(request == null ? null : request.getMachineName())
                .setMacAddress(request == null ? null : request.getMacAddress());
        return new ObjectRestResponse().data(robotService.register(robot));
    }

    @PostMapping("/command")
    public ObjectRestResponse command(@RequestBody RobotCommandRequest request) {
        Long id = request == null ? null : request.getId();
        String command = request == null ? null : request.getCommand();
        if (ObjectUtils.isEmpty(command)) {
            throw new BizException("机器人指令不能为空");
        }
        robotService.control(id, command);
        return new ObjectRestResponse();
    }
}
