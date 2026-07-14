package com.lu.admin.modules.clip.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("clip_record")
@Schema(description = "剪辑记录")
public class ClipRecord extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 商品ID
     */
    @Schema(description = "商品ID")
    private String productId;

    /**
     * 商品标题：通过商品ID关联选品记录查询
     */
    @TableField(exist = false)
    @Schema(description = "商品标题：通过商品ID关联选品记录查询")
    private String productTitle;

    /**
     * 商品品类：通过商品ID关联选品记录，再关联商品品类查询
     */
    @TableField(exist = false)
    @Schema(description = "商品品类：通过商品ID关联选品记录，再关联商品品类查询")
    private String productCategoryName;

    /**
     * 剪辑配置ID：通过选品账号关联发布账号和发布配置查询
     */
    @TableField(exist = false)
    @Schema(description = "剪辑配置ID：通过选品账号关联发布账号和发布配置查询")
    private Long clipConfigId;

    /**
     * 剪辑配置代码：通过剪辑配置ID关联剪辑配置查询
     */
    @TableField(exist = false)
    @Schema(description = "剪辑配置代码：通过剪辑配置ID关联剪辑配置查询")
    private String clipConfigCode;

    /**
     * 状态：通过商品ID关联选品记录查询
     */
    @TableField(exist = false)
    @Schema(description = "状态：通过商品ID关联选品记录查询", example = "待剪辑")
    private String status;

    /**
     * 原因：通过商品ID关联选品记录查询
     */
    @TableField(exist = false)
    @Schema(description = "原因：通过商品ID关联选品记录查询")
    private String reason;

    /**
     * 视频标题：通过商品ID关联选品记录查询
     */
    @TableField(exist = false)
    @Schema(description = "视频标题：通过商品ID关联选品记录查询")
    private String videoTitle;

    /**
     * 视频文案：通过商品ID关联选品记录查询
     */
    @TableField(exist = false)
    @Schema(description = "视频文案：通过商品ID关联选品记录查询")
    private String videoCopy;

    /**
     * 视频话题：通过商品ID关联选品记录查询
     */
    @TableField(exist = false)
    @Schema(description = "视频话题：通过商品ID关联选品记录查询")
    private String videoTopic;
}
