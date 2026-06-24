package com.lu.admin.modules.sys.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.modules.sys.entity.SysPerm;
import com.lu.admin.modules.sys.mapper.SysPermMapper;
import com.lu.admin.modules.sys.vo.AuthVo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * <p>
 * 权限 服务实现类
 * </p>
 *
 * @author 
 * @since 2021-05-14
 */
@Service
public class SysPermBiz extends ServiceImpl<SysPermMapper, SysPerm> {
    public Set<AuthVo> getPermsByUserId(String userId) {
        List<SysPerm> list = baseMapper.getPermsByUserId(userId);
        return list.stream().map(p->new AuthVo(p.getPname(),p.getPval())).collect(Collectors.toSet());
    }

    public List<SysPerm> getPermsByRoleId(String roleId) {
        return baseMapper.getPermsByRoleId(roleId);
    }

    public void saveOrUpdate(List<SysPerm> perms) {
        if (perms!=null&&!perms.isEmpty()){
            baseMapper.saveOrUpdate(perms);
        }
    }
}
