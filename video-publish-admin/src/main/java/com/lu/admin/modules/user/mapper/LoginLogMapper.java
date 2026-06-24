package com.lu.admin.modules.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.modules.user.dto.LoginLogDto;
import com.lu.admin.modules.user.dto.LoginLogSearchDto;
import com.lu.admin.modules.user.entity.LoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * <p>
 *  Mapper 接口
 * </p>
 *
 * @author 
 * @since 2024-04-10
 */
@Mapper
public interface LoginLogMapper extends BaseMapper<LoginLog> {
    Page<LoginLogDto> getByPage(Page page, @Param("params") LoginLogSearchDto params);
}
