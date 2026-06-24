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
@TableName("clip_rule")
@Schema(description = "剪辑规则")
public class ClipRule extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 规则名称
     */
    @Schema(description = "规则名称")
    private String name;

    /**
     * 状态 1启用、0禁用
     */
    @Schema(description = "状态：1启用、0禁用", example = "1")
    private Integer status;

    /**
     * 剪辑数（累计执行次数）
     */
    @Schema(description = "剪辑数，累计执行次数", example = "0")
    private Integer clipCount;

    /**
     * 规则项名称汇总（按 seq 排序，逗号分隔；非表字段）
     */
    @TableField(exist = false)
    @Schema(description = "规则项名称汇总，按排序逗号分隔")
    private String itemNames;
}
