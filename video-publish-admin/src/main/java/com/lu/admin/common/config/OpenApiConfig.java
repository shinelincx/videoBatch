package com.lu.admin.common.config;

import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.GroupedOpenApi;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class OpenApiConfig {

    private static final Map<String, String> CONTROLLER_NAMES;
    private static final Map<String, String> METHOD_NAMES;
    private static final Map<String, String> METHOD_ACTION_NAMES;

    static {
        Map<String, String> controllerNames = new HashMap<>();
        controllerNames.put("AccountController", "基础配置-账号管理");
        controllerNames.put("ProductCategoryController", "基础配置-商品类目");
        controllerNames.put("ProxyConfigController", "基础配置-代理配置");
        controllerNames.put("RobotController", "基础配置-机器人管理");
        controllerNames.put("ClipConfigController", "剪辑配置");
        controllerNames.put("ClipRecordController", "剪辑记录");
        controllerNames.put("ClipRuleController", "剪辑规则");
        controllerNames.put("ClipRuleItemController", "剪辑规则项");
        controllerNames.put("AiEditingController", "AI剪辑");
        controllerNames.put("ClipEditingController", "切片剪辑");
        controllerNames.put("MixedEditingController", "混剪任务");
        controllerNames.put("PublishAccountController", "发布账号");
        controllerNames.put("PublishConfigController", "发布配置");
        controllerNames.put("PublishRecordController", "发布记录");
        controllerNames.put("SelectionRecordController", "选品记录");
        controllerNames.put("SelectionSettingsController", "选品设置");
        controllerNames.put("SelectionSourceController", "选品来源");
        controllerNames.put("SelectionStrategyController", "选品策略");
        controllerNames.put("SelectionStrategyItemController", "选品策略项");
        controllerNames.put("AuthController", "认证登录");
        controllerNames.put("OptionController", "通用选项");
        controllerNames.put("SysPermController", "系统权限");
        controllerNames.put("SysRoleController", "系统角色");
        controllerNames.put("SysTenantController", "系统租户");
        controllerNames.put("SysUserController", "系统用户");
        controllerNames.put("LoginLogController", "登录日志");
        controllerNames.put("UserController", "用户管理");
        CONTROLLER_NAMES = Collections.unmodifiableMap(controllerNames);

        Map<String, String> methodNames = new HashMap<>();
        methodNames.put("page", "分页查询");
        methodNames.put("list", "列表查询");
        methodNames.put("create", "新增");
        methodNames.put("add", "新增");
        methodNames.put("update", "编辑");
        methodNames.put("delete", "删除");
        methodNames.put("query", "分页查询");
        methodNames.put("columns", "查询字段配置");
        methodNames.put("configMap", "查询配置结构");
        methodNames.put("register", "注册");
        methodNames.put("online", "查询在线客户端");
        methodNames.put("command", "下发命令");
        methodNames.put("getItems", "查询明细项");
        methodNames.put("itemOptions", "查询明细项选项");
        methodNames.put("saveItems", "保存明细项");
        methodNames.put("execute", "执行");
        methodNames.put("page401", "未登录响应");
        methodNames.put("page403", "无权限响应");
        methodNames.put("pageIndex", "登录成功响应");
        methodNames.put("login", "登录");
        methodNames.put("logout", "退出登录");
        methodNames.put("info", "当前登录信息");
        methodNames.put("listRoleOptions", "查询角色选项");
        methodNames.put("listAllPermission", "查询全部权限");
        methodNames.put("listButtonPermMapGroupByParent", "查询按钮权限分组");
        methodNames.put("syncMenuPermission", "同步菜单权限");
        methodNames.put("syncApiPermission", "同步接口权限");
        methodNames.put("listApiPermMetadata", "查询接口权限元数据");
        methodNames.put("updateRolePerm", "更新角色权限");
        methodNames.put("addPerm", "新增角色权限");
        methodNames.put("deletePerm", "删除角色权限");
        methodNames.put("findRolePerms", "查询角色权限");
        methodNames.put("updateUserRole", "更新用户角色");
        methodNames.put("userInfo", "查询当前用户信息");
        methodNames.put("updatePwd", "修改密码");
        methodNames.put("findUserRoles", "查询用户角色");
        methodNames.put("importAccounts", "导入账号");
        methodNames.put("syncStatus", "同步账号状态");
        methodNames.put("startSelection", "启动选品任务");
        methodNames.put("collectCategories", "启动采集品类任务");
        methodNames.put("stopCollectCategories", "停止采集品类任务");
        methodNames.put("pollTask", "客户端轮询任务");
        methodNames.put("syncBuyin", "同步百应类目");
        METHOD_NAMES = Collections.unmodifiableMap(methodNames);

        Map<String, String> methodActionNames = new HashMap<>();
        methodActionNames.put("ClipRuleController#getItems", "查询剪辑规则明细项");
        methodActionNames.put("ClipRuleController#itemOptions", "查询剪辑规则项选项");
        methodActionNames.put("ClipRuleController#saveItems", "保存剪辑规则明细项");
        methodActionNames.put("ClipRuleController#execute", "执行剪辑规则");
        methodActionNames.put("RobotController#register", "机器人注册");
        methodActionNames.put("RobotController#online", "查询在线客户端");
        methodActionNames.put("RobotController#command", "下发机器人命令");
        methodActionNames.put("PublishAccountController#login", "发布账号登录");
        methodActionNames.put("PublishAccountController#startPublish", "启动发布");
        methodActionNames.put("PublishAccountController#pollTask", "客户端轮询发布账号任务");
        methodActionNames.put("PublishConfigController#columns", "查询发布配置字段");
        methodActionNames.put("PublishAccountController#columns", "查询发布账号字段");
        methodActionNames.put("SysPermController#listApiPermMetadata", "查询 Controller 接口权限元数据");
        METHOD_ACTION_NAMES = Collections.unmodifiableMap(methodActionNames);
    }

    @Bean
    public OpenAPI videoPublishAdminOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("视频发布管理系统 API")
                        .description("video-publish-admin Controller 接口文档")
                        .version("1.0.0")
                        .license(new License().name("内部使用")))
                .servers(Collections.singletonList(new Server()
                        .url("/")
                        .description("当前服务")));
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("video-publish-admin")
                .packagesToScan("com.lu.admin.modules")
                .pathsToMatch("/**")
                .build();
    }

    @Bean
    public OperationCustomizer chineseOperationCustomizer() {
        return new OperationCustomizer() {
            @Override
            public Operation customize(Operation operation, HandlerMethod handlerMethod) {
                String controllerName = handlerMethod.getBeanType().getSimpleName();
                String methodName = handlerMethod.getMethod().getName();
                String moduleName = CONTROLLER_NAMES.containsKey(controllerName)
                        ? CONTROLLER_NAMES.get(controllerName)
                        : controllerName;
                String actionName = resolveActionName(controllerName, methodName);

                operation.setTags(Collections.singletonList(moduleName));
                operation.setSummary(moduleName + " - " + actionName);
                operation.setDescription("接口说明：" + actionName + "。");
                return operation;
            }
        };
    }

    private String resolveActionName(String controllerName, String methodName) {
        String key = controllerName + "#" + methodName;
        if (METHOD_ACTION_NAMES.containsKey(key)) {
            return METHOD_ACTION_NAMES.get(key);
        }
        if (METHOD_NAMES.containsKey(methodName)) {
            return METHOD_NAMES.get(methodName);
        }
        return methodName;
    }
}
