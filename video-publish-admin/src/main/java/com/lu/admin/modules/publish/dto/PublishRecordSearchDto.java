package com.lu.admin.modules.publish.dto;

import com.lu.admin.modules.publish.entity.PublishRecord;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PublishRecordSearchDto extends PublishRecord {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime publishStartTime;
    private LocalDateTime publishEndTime;
}