package com.lu.admin.modules.sys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.modules.sys.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;


@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
    IPage<SysUser> selectUserIncludeRoles(Page<?> page,
                                          @Param("nick") String nick,
                                          @Param("tenantId") Long tenantId);

    SysUser getSysUser();
}
