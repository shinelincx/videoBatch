package com.lu.admin.modules.sys.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.modules.sys.entity.SysUser;
import com.lu.admin.modules.sys.mapper.SysUserMapper;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 
 * @since 2021-05-14
 */
@Service
public class SysUserBiz extends ServiceImpl<SysUserMapper, SysUser> {
    public IPage<SysUser> queryUserIncludeRoles(Page<?> page, String nick, Long tenantId) {
        return baseMapper.selectUserIncludeRoles(page, nick, tenantId);
    }
}
