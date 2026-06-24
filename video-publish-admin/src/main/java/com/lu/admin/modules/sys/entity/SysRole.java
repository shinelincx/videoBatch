package com.lu.admin.modules.sys.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.Date;

/**
 * <p>
 * 
 * </p>
 *
 * @author 
 * @since 2021-05-14
 */
@Schema(description = "系统角色")
public class SysRole implements Serializable {

    private static final long serialVersionUID=1L;

    /**
     * 角色id
     */
    @TableId(type = IdType.ID_WORKER)
    @Schema(description = "角色ID", example = "1780000000000000000")
    private String rid;

    /**
     * 角色名，用于显示
     */
    @Schema(description = "角色名称", example = "管理员")
    private String rname;

    /**
     * 角色描述
     */
    @Schema(description = "角色描述")
    private String rdesc;

    /**
     * 角色值，用于权限判断
     */
    @Schema(description = "角色权限值", example = "admin")
    private String rval;

    /**
     * 创建时间
     */
    @Schema(description = "创建时间")
    private Date created;

    /**
     * 修改时间
     */
    @Schema(description = "修改时间")
    private Date updated;

    public String getRid() {
        return rid;
    }

    public void setRid(String rid) {
        this.rid = rid;
    }
    public String getRname() {
        return rname;
    }

    public void setRname(String rname) {
        this.rname = rname;
    }
    public String getRdesc() {
        return rdesc;
    }

    public void setRdesc(String rdesc) {
        this.rdesc = rdesc;
    }
    public String getRval() {
        return rval;
    }

    public void setRval(String rval) {
        this.rval = rval;
    }
    public Date getCreated() {
        return created;
    }

    public void setCreated(Date created) {
        this.created = created;
    }
    public Date getUpdated() {
        return updated;
    }

    public void setUpdated(Date updated) {
        this.updated = updated;
    }

}
