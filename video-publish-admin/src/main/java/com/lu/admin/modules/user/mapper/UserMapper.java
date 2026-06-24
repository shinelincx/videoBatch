package com.lu.admin.modules.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.modules.user.dto.UserDTO;
import com.lu.admin.modules.user.dto.UserSearchDto;
import com.lu.admin.modules.user.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * <p>
 * 用户表 Mapper 接口
 * </p>
 *
 * @author 
 * @since 2024-04-08
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    Page<UserDTO> getByPage(Page page, @Param("params") UserSearchDto params);

    UserDTO getUser(Integer userId);
}
