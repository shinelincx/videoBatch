package com.lu.admin.common.utils;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lu.admin.common.shiro.ShiroUtils;
import com.lu.admin.modules.sys.entity.SysUser;

public class TenantUtils {

    private TenantUtils() {
    }

    public static Long currentTenantId() {
        try {
            SysUser user = ShiroUtils.getSysUser();
            return user == null ? null : user.getTenantId();
        } catch (Exception ignored) {
            return null;
        }
    }

    public static <T> QueryWrapper<T> filter(QueryWrapper<T> wrapper) {
        Long tenantId = currentTenantId();
        if (tenantId != null) {
            wrapper.eq("tenant_id", tenantId);
        }
        return wrapper;
    }
}
