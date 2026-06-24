package com.lu.admin.modules.user.dto;

import com.lu.admin.modules.user.entity.LoginLog;
import lombok.Data;

@Data
public class LoginLogDto extends LoginLog {
    private String nickName;
}
