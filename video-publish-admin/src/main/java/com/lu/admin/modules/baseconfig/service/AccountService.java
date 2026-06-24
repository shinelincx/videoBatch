package com.lu.admin.modules.baseconfig.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.modules.baseconfig.dto.AccountLoginRequest;
import com.lu.admin.modules.baseconfig.entity.Account;
import com.lu.admin.modules.baseconfig.mapper.AccountMapper;
import com.lu.admin.modules.publish.service.PublishAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AccountService extends ServiceImpl<AccountMapper, Account> {

    @Autowired
    private PublishAccountService publishAccountService;

    public Map<String, Object> login(AccountLoginRequest body) {
        return publishAccountService.loginByAccountId(
                body == null ? null : body.getAccountId(),
                body == null ? null : body.getRobotId());
    }
}
