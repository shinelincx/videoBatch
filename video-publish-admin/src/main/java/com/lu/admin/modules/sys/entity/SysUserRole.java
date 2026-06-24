package com.lu.admin.modules.sys.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("sys_user_role")
@AllArgsConstructor
public class SysUserRole implements Serializable {

    private static final long serialVersionUID=1L;

    @TableField("user_id")
    private String userId;

    @TableField("role_id")
    private String roleId;

}
