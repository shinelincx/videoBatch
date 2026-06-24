package com.lu.admin.modules.user.controller;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.user.dto.LoginLogDto;
import com.lu.admin.modules.user.dto.LoginLogSearchDto;
import com.lu.admin.modules.user.service.LoginLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 *  前端控制器
 * </p>
 *
 * @author 
 * @since 2024-04-10
 */
@RestController
@RequestMapping("/user/login-log")
public class LoginLogController {

    @Autowired
    private LoginLogService loginLogService;

    @PostMapping("page")
    public ObjectRestResponse page(@RequestBody BasePage<LoginLogSearchDto> queryPage) {
        IPage<LoginLogDto> page = this.loginLogService.getBaseMapper().getByPage(queryPage.createPage(), queryPage.getParams());
        return new ObjectRestResponse().data(page);
    }
}

