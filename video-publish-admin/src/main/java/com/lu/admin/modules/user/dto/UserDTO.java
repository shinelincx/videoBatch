package com.lu.admin.modules.user.dto;

import com.lu.admin.modules.user.entity.User;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class UserDTO extends User {
    private BigDecimal balance;
    private LocalDateTime loginTime;
    private String loginIp;
    private String platformName;
}
