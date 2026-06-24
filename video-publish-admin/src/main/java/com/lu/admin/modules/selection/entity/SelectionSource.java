package com.lu.admin.modules.selection.entity;

import com.lu.admin.base.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@Schema(description = "选品来源")
public class SelectionSource extends BaseEntity {

    private static final long serialVersionUID=1L;

    /**
     * 来源名称
     */
    @Schema(description = "来源名称")
    private String name;

    /**
     * 来源类型 1抖音、2快手、3小红书、4淘宝
     */
    @Schema(description = "来源类型：1抖音、2快手、3小红书、4淘宝", example = "1")
    private Integer sourceType;

    /**
     * 来源URL
     */
    @Schema(description = "来源URL")
    private String sourceUrl;

    /**
     * API密钥
     */
    @Schema(description = "API密钥")
    private String apiKey;

    /**
     * 状态 0禁用、1启用
     */
    @Schema(description = "状态：0禁用、1启用", example = "1")
    private Integer status;

    /**
     * 备注
     */
    @Schema(description = "备注")
    private String remark;
}
