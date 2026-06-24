package com.lu.admin.modules.user.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.modules.user.entity.User;
import com.lu.admin.modules.user.mapper.UserMapper;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 用户表 服务实现类
 * </p>
 *
 * @author 
 * @since 2024-04-08
 */
@Service
public class UserService extends ServiceImpl<UserMapper, User> {
    public void registerUser(User user){
        User newUser = new User();
        newUser.setNickName(user.getNickName());
        newUser.setAccount(user.getAccount());
        newUser.setPassword(user.getPassword());
        newUser.setType(1);
        newUser.setStatus(1);
        this.save(newUser);
    }

}
