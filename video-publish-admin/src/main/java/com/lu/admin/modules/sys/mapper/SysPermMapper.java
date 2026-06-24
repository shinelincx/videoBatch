package com.lu.admin.modules.sys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lu.admin.modules.sys.entity.SysPerm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 权限 Mapper 接口
 * </p>
 *
 * @author 
 * @since 2021-05-14
 */
@Mapper
public interface SysPermMapper extends BaseMapper<SysPerm> {
    List<SysPerm> getPermsByUserId(@Param("userId") String userId);

    List<SysPerm> getPermsByRoleId(@Param("roleId") String roleId);

    void saveOrUpdate(@Param("perms") List<SysPerm> perms);
}
