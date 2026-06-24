package com.lu.admin.common.shiro;

import com.lu.admin.modules.sys.entity.SysUser;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

public class ShiroUtils {
    public static SysUser getSysUser(){
        Subject subject = SecurityUtils.getSubject();
        SysUser sysUser = (SysUser) subject.getPrincipal();
        return sysUser;
    }
}
