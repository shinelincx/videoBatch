package com.lu.admin.modules.sys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lu.admin.modules.sys.entity.SysRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SysRoleMapper extends BaseMapper<SysRole> {

    List<SysRole> getRolesByUserId(@Param("userId") String userId);

    List<String> getRoleIdsByUserId(@Param("userId") String userId);

    Boolean checkRidsContainRval(@Param("rids") List<String> rids, @Param("rval") String rval);

    Boolean checkUidContainRval(@Param("uid") String uid, @Param("rval") String rval);
}
