package com.lu.admin.modules.sys.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * <p>
 * 权限
 * </p>
 *
 * @author 
 * @since 2021-05-14
 */
@Schema(description = "系统权限")
public class SysPerm implements Serializable {

    private static final long serialVersionUID=1L;

    /**
     * 权限值，shiro的权限控制表达式
     */
    @TableId(type = IdType.INPUT)
    @Schema(description = "权限值，Shiro 权限控制表达式", example = "sys:user:list")
    private String pval;

    /**
     * 父权限id
     */
    @Schema(description = "父权限值", example = "sys:user")
    private String parent;

    /**
     * 权限名称
     */
    @Schema(description = "权限名称", example = "用户列表")
    private String pname;

    /**
     * 权限类型：1.菜单 2.按钮 3.接口 4.特殊
     */
    @Schema(description = "权限类型：1菜单、2按钮、3接口、4特殊", example = "1")
    private Integer ptype;

    /**
     * 是否叶子节点
     */
    @Schema(description = "是否叶子节点", example = "true")
    private Boolean leaf;

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

    @TableField(exist = false)
    @Schema(description = "子权限列表")
    private List<SysPerm> children = new ArrayList<>();

    public String getPval() {
        return pval;
    }

    public void setPval(String pval) {
        this.pval = pval;
    }
    public String getParent() {
        return parent;
    }

    public void setParent(String parent) {
        this.parent = parent;
    }
    public String getPname() {
        return pname;
    }

    public void setPname(String pname) {
        this.pname = pname;
    }
    public Integer getPtype() {
        return ptype;
    }

    public void setPtype(Integer ptype) {
        this.ptype = ptype;
    }
    public Boolean getLeaf() {
        return leaf;
    }

    public void setLeaf(Boolean leaf) {
        this.leaf = leaf;
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

    public List<SysPerm> getChildren() {
        return children;
    }

    public void setChildren(List<SysPerm> children) {
        this.children = children;
    }
}
