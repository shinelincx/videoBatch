package com.lu.admin.modules.baseconfig.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.baseconfig.entity.Robot;
import com.lu.admin.modules.baseconfig.mapper.RobotMapper;
import com.lu.admin.modules.client.service.ClientCommandPushService;
import com.lu.admin.modules.sys.entity.SysTenant;
import com.lu.admin.modules.sys.service.SysTenantBiz;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RobotService extends ServiceImpl<RobotMapper, Robot> {

    public static final String STATUS_OFFLINE = "离线";
    public static final String STATUS_STANDBY = "待机";
    public static final String STATUS_RUNNING = "运行中";
    public static final String STATUS_PAUSED = "暂停中";
    public static final String COMMAND_LOGIN = "login";
    public static final String COMMAND_PUBLISH = "publish";

    private static final long HEARTBEAT_OFFLINE_SECONDS = 60;
    private static final Set<String> STATUS_VALUES = new HashSet<>(Arrays.asList(
            STATUS_OFFLINE, STATUS_STANDBY, STATUS_RUNNING, STATUS_PAUSED
    ));
    private static final Set<String> COMMAND_VALUES = new HashSet<>(Arrays.asList(
            "start", "resume", "pause", "stop", COMMAND_LOGIN, COMMAND_PUBLISH
    ));

    @Autowired
    private SysTenantBiz tenantService;

    @Autowired
    private ClientCommandPushService commandPushService;

    public Robot register(Robot payload) {
        return register(payload, TenantUtils.currentTenantId());
    }

    public Robot register(Robot payload, Long tenantId) {
        return saveOrUpdateRobot(payload, tenantId, RobotService.STATUS_STANDBY, true);
    }

    public Robot heartbeat(Robot payload) {
        return heartbeat(payload, TenantUtils.currentTenantId());
    }

    public Robot heartbeat(Robot payload, Long tenantId) {
        return saveOrUpdateRobot(payload, tenantId, payload == null ? null : payload.getStatus(), true);
    }

    private Robot saveOrUpdateRobot(Robot payload, Long tenantId, String statusValue, boolean refreshHeartbeat) {
        String machineName = normalizeMachineName(payload == null ? null : payload.getMachineName());
        String status = normalizeStatus(statusValue);

        Robot robot = getOne(robotQuery(machineName, tenantId).last("limit 1"));
        LocalDateTime now = LocalDateTime.now();
        if (robot == null) {
            robot = new Robot()
                    .setMachineName(machineName)
                    .setMacAddress(trim(payload == null ? null : payload.getMacAddress()))
                    .setStatus(status)
                    .setTenantId(tenantId);
            if (refreshHeartbeat) {
                robot.setLastHeartbeatTime(now);
            }
            save(robot);
            return robot;
        }

        Robot update = new Robot()
                .setMacAddress(trim(payload == null ? null : payload.getMacAddress()))
                .setStatus(status);
        if (refreshHeartbeat) {
            update.setLastHeartbeatTime(now);
        }
        update(update, new UpdateWrapper<Robot>().eq("id", robot.getId()));
        robot.setMacAddress(update.getMacAddress());
        robot.setStatus(status);
        if (refreshHeartbeat) {
            robot.setLastHeartbeatTime(now);
        }
        return robot;
    }

    public void control(Long id, String command) {
        control(id, command, null);
    }

    public void control(Long id, String command, String payload) {
        if (id == null) {
            throw new BizException("请选择机器人");
        }
        String normalizedCommand = normalizeCommand(command);
        LocalDateTime commandTime = LocalDateTime.now();
        String payloadValue = value(payload);
        commandPushService.savePayload(id, payloadValue);
        Robot update = new Robot()
                .setCurrentCommand(normalizedCommand)
                .setStatus(statusForCommand(normalizedCommand))
                .setCommandTime(commandTime);
        UpdateWrapper<Robot> wrapper = new UpdateWrapper<Robot>().eq("id", id);
        Long tenantId = TenantUtils.currentTenantId();
        if (tenantId != null) {
            wrapper.eq("tenant_id", tenantId);
        }
        boolean success = update(update, wrapper);
        if (!success) {
            throw new BizException("机器人不存在或无权操作");
        }
        boolean pushed = commandPushService.push(id, commandMap(id, normalizedCommand, payloadValue, commandTime));
        if (pushed) {
            clearPendingCommand(id, normalizedCommand, tenantId);
        }
    }

    public Map<String, Object> pollCommand(Robot payload) {
        return pollCommand(payload, TenantUtils.currentTenantId());
    }

    public Map<String, Object> pollCommand(Robot payload, Long tenantId) {
        String machineName = normalizeMachineName(payload == null ? null : payload.getMachineName());
        Robot robot = getOne(robotQuery(machineName, tenantId).last("limit 1"));
        if (robot == null || ObjectUtils.isEmpty(robot.getCurrentCommand())) {
            return new LinkedHashMap<>();
        }

        String command = robot.getCurrentCommand();
        String commandPayload = commandPushService.takePayload(robot.getId());
        Robot update = new Robot()
                .setCurrentCommand("")
                .setLastCommand(command);
        update(update, new UpdateWrapper<Robot>()
                .eq("id", robot.getId())
                .eq("current_command", command));

        return commandMap(robot.getId(), command, commandPayload, robot.getCommandTime());
    }

    private void clearPendingCommand(Long id, String command, Long tenantId) {
        Robot update = new Robot()
                .setCurrentCommand("")
                .setLastCommand(command);
        UpdateWrapper<Robot> wrapper = new UpdateWrapper<Robot>()
                .eq("id", id)
                .eq("current_command", command);
        if (tenantId != null) {
            wrapper.eq("tenant_id", tenantId);
        }
        update(update, wrapper);
        commandPushService.removePayload(id);
    }

    public List<Robot> listOnline() {
        List<Robot> robots = list(TenantUtils.filter(new QueryWrapper<Robot>())
                .orderByDesc("last_heartbeat_time")
                .orderByDesc("id"));
        applyHeartbeatStatus(robots);
        fillTenantNames(robots);
        return robots.stream()
                .filter(this::isOnline)
                .collect(Collectors.toList());
    }

    public Robot requireOnline(Long id) {
        if (id == null) {
            throw new BizException("请选择当前在线的客户端");
        }
        Robot robot = getOne(TenantUtils.filter(new QueryWrapper<Robot>().eq("id", id)).last("limit 1"));
        if (robot == null) {
            throw new BizException("客户端不存在或无权操作");
        }
        applyHeartbeatStatus(Arrays.asList(robot));
        if (!isOnline(robot)) {
            throw new BizException("请选择当前在线的客户端");
        }
        return robot;
    }

    public void fillTenantNames(List<Robot> robots) {
        if (robots == null || robots.isEmpty()) {
            return;
        }
        List<Long> tenantIds = robots.stream()
                .map(Robot::getTenantId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        if (tenantIds.isEmpty()) {
            return;
        }
        Map<Long, String> tenantNames = new HashMap<>();
        for (SysTenant tenant : tenantService.listByIds(tenantIds)) {
            tenantNames.put(tenant.getId(), tenant.getName());
        }
        robots.forEach(robot -> robot.setTenantName(tenantNames.get(robot.getTenantId())));
    }

    public void applyHeartbeatStatus(List<Robot> robots) {
        if (robots == null || robots.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (Robot robot : robots) {
            LocalDateTime heartbeatTime = robot.getLastHeartbeatTime();
            if (isHeartbeatExpired(heartbeatTime, now)) {
                robot.setStatus(STATUS_OFFLINE);
            }
        }
    }

    private Map<String, Object> commandMap(Long robotId, String command, String payload, LocalDateTime commandTime) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("robotId", robotId);
        result.put("command", value(command));
        result.put("payload", value(payload));
        result.put("commandTime", commandTime);
        return result;
    }

    private boolean isOnline(Robot robot) {
        if (robot == null || STATUS_OFFLINE.equals(robot.getStatus())) {
            return false;
        }
        return !isHeartbeatExpired(robot.getLastHeartbeatTime(), LocalDateTime.now());
    }

    private boolean isHeartbeatExpired(LocalDateTime heartbeatTime, LocalDateTime now) {
        return heartbeatTime == null || Duration.between(heartbeatTime, now).getSeconds() > HEARTBEAT_OFFLINE_SECONDS;
    }

    private QueryWrapper<Robot> robotQuery(String machineName, Long tenantId) {
        QueryWrapper<Robot> wrapper = new QueryWrapper<Robot>().eq("machine_name", machineName);
        if (tenantId != null) {
            wrapper.eq("tenant_id", tenantId);
        } else {
            wrapper.isNull("tenant_id");
        }
        return wrapper;
    }

    private String normalizeMachineName(String machineName) {
        String value = trim(machineName);
        if (ObjectUtils.isEmpty(value)) {
            throw new BizException("机器名称不能为空");
        }
        return value;
    }

    private String normalizeStatus(String status) {
        String value = trim(status);
        if (STATUS_VALUES.contains(value)) {
            return value;
        }
        return STATUS_STANDBY;
    }

    private String normalizeCommand(String command) {
        String value = trim(command);
        if (!COMMAND_VALUES.contains(value)) {
            throw new BizException("不支持的机器人指令：" + value);
        }
        return value;
    }

    private String statusForCommand(String command) {
        if ("pause".equals(command)) {
            return STATUS_PAUSED;
        }
        if ("stop".equals(command)) {
            return STATUS_STANDBY;
        }
        return STATUS_RUNNING;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
