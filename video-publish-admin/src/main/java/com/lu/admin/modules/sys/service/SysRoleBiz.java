package com.lu.admin.modules.sys.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.modules.sys.entity.SysRole;
import com.lu.admin.modules.sys.mapper.SysRoleMapper;
import com.lu.admin.modules.sys.vo.AuthVo;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SysRoleBiz extends ServiceImpl<SysRoleMapper, SysRole> {

    public Set<AuthVo> getRolesByUserId(String userId) {
        List<SysRole> list = this.getBaseMapper().getRolesByUserId(userId);
        return list.stream().map(r->new AuthVo(r.getRname(),r.getRval())).collect(Collectors.toSet());
    }

    public List<String> getRoleIdsByUserId(String userId) {
        return baseMapper.getRoleIdsByUserId(userId);
    }

    public boolean checkRidsContainRval(List<String> rids, String rval) {
        if (rids.isEmpty()) return false;
        Boolean re = baseMapper.checkRidsContainRval(rids, rval);
        return re==null?false:re.booleanValue();
    }

    public boolean checkUidContainRval(String uid, String rval) {
        if (StringUtils.isEmpty(uid)) return false;
        Boolean re = baseMapper.checkUidContainRval(uid, rval);
        return re==null?false:re.booleanValue();
    }
}
