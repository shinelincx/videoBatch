package com.lu.admin.modules.user.controller;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.lu.admin.base.BasePage;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.modules.sys.entity.SysUser;
import com.lu.admin.modules.user.dto.UserDTO;
import com.lu.admin.modules.user.dto.UserSearchDto;
import com.lu.admin.modules.user.entity.User;
import com.lu.admin.modules.user.service.UserService;
import org.apache.shiro.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 用户表 前端控制器
 * </p>
 *
 * @author 
 * @since 2024-04-08
 */
@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;


    @PostMapping("page")
    public ObjectRestResponse page(@RequestBody BasePage<UserSearchDto> queryPage) {
        SysUser user = (SysUser) SecurityUtils.getSubject().getPrincipal();
        IPage<UserDTO> page = this.userService.getBaseMapper().getByPage(queryPage.createPage(), queryPage.getParams());
        return new ObjectRestResponse().data(page);
    }

    @PostMapping("/create")
    public ObjectRestResponse create(@RequestBody User user) {
        this.userService.registerUser(user);
        return new ObjectRestResponse();
    }
}

