package com.lu.admin.modules.publish.entity;

import com.lu.admin.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
public class PublishRecord extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 策略ID
     */
    private Long strategyId;

    /**
     * 策略名称
     */
    private String strategyName;

    /**
     * 账号ID
     */
    private Long accountId;

    /**
     * 账号名称
     */
    private String accountName;

    /**
     * 发布状态：待发布、发布中、发布失败、发布成功
     */
    private String status;

    /**
     * 平台类型 1抖音、2快手、3小红书、4淘宝、5视频号
     */
    private Integer platformType;

    /**
     * 视频ID
     */
    private Long videoId;

    /**
     * 视频标题
     */
    private String videoTitle;

    /**
     * 视频封面
     */
    private String videoCover;

    /**
     * 发布状态 0待发布、1发布中、2已发布、3发布失败
     */
    private Integer publishStatus;

    /**
     * 平台返回的发布ID
     */
    private String platformPublishId;

    /**
     * 平台返回消息
     */
    private String platformMsg;

    /**
     * 发布时间
     */
    private java.time.LocalDateTime publishTime;

    /**
     * 视频链接
     */
    private String videoUrl;

    /**
     * 错误信息
     */
    private String errorMsg;

    /**
     * 备注
     */
    private String remark;
}
