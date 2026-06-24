package com.lu.admin.modules.publish.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PublishRecordDTO {
    private Long id;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    private Long strategyId;
    private String strategyName;
    private Long accountId;
    private String accountName;
    private Integer platformType;
    private String platformTypeName;
    private Long videoId;
    private String videoTitle;
    private String videoCover;
    private Integer publishStatus;
    private String publishStatusName;
    private String platformPublishId;
    private String platformMsg;
    private LocalDateTime publishTime;
    private String videoUrl;
    private String errorMsg;
    private String remark;
}