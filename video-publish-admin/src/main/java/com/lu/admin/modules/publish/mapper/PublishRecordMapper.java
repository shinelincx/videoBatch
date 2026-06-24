package com.lu.admin.modules.publish.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.modules.publish.dto.PublishRecordDTO;
import com.lu.admin.modules.publish.dto.PublishRecordSearchDto;
import com.lu.admin.modules.publish.entity.PublishRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PublishRecordMapper extends BaseMapper<PublishRecord> {
    Page<PublishRecordDTO> getByPage(Page page, @Param("params") PublishRecordSearchDto params);
}