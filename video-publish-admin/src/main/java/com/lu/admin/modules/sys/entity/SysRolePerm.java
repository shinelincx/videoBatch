package com.lu.admin.modules.sys.entity;

import com.baomidou.mybatisplus.annotation.TableField;

import java.io.Serializable;

/**
 * <p>
 * 
 * </p>
 *
 * @author 
 * @since 2021-05-14
 */
public class SysRolePerm implements Serializable {

    private static final long serialVersionUID=1L;

    @TableField("role_id")
    private String roleId;

    @TableField("perm_val")
    private String permVal;

    private Integer permType;

    public SysRolePerm() {
    }

    public SysRolePerm(String roleId, String permVal,Integer permType) {
        this.roleId = roleId;
        this.permVal = permVal;
        this.permType = permType;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }
    public String getPermVal() {
        return permVal;
    }

    public void setPermVal(String permVal) {
        this.permVal = permVal;
    }
    public Integer getPermType() {
        return permType;
    }

    public void setPermType(Integer permType) {
        this.permType = permType;
    }

}
