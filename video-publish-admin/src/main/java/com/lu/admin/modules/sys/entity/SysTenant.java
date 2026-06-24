package com.lu.admin.modules.sys.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.util.ObjectUtils;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("sys_tenant")
@Schema(description = "系统租户")
public class SysTenant implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 租户ID
     */
    @TableId(value = "id", type = IdType.ID_WORKER)
    @Schema(description = "租户ID", example = "1")
    private Long id;

    /**
     * 租户名称
     */
    @Schema(description = "租户名称", example = "默认租户")
    private String name;

    /**
     * 创建时间
     */
    @Schema(description = "创建时间")
    private Date createTime;

    /**
     * 更新时间
     */
    @Schema(description = "更新时间")
    private Date updateTime;

    /**
     * 删除标识：0正常 1删除
     */
    @TableLogic
    @Schema(description = "删除标识：0正常、1删除", example = "0")
    private Integer deleted;

    public String getTid() {
        return id == null ? null : String.valueOf(id);
    }

    public void setTid(String tid) {
        this.id = parseId(tid);
    }

    public String getTname() {
        return name;
    }

    public void setTname(String tname) {
        this.name = tname;
    }

    public Date getCreated() {
        return createTime;
    }

    public void setCreated(Date created) {
        this.createTime = created;
    }

    public Date getUpdated() {
        return updateTime;
    }

    public void setUpdated(Date updated) {
        this.updateTime = updated;
    }

    private Long parseId(String value) {
        if (ObjectUtils.isEmpty(value)) {
            return null;
        }
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
