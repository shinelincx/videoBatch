package com.lu.admin.modules.sys.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.lu.admin.modules.sys.vo.AuthVo;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.*;

/**
 * <p>
 * 
 * </p>
 *
 * @author 
 * @since 2021-05-14
 */
@Data
@Schema(description = "系统用户")
public class SysUser implements Serializable {

    private static final long serialVersionUID=1L;

    /**
     * 用户id
     */
    @TableId(value = "uid", type = IdType.ID_WORKER)
    @Schema(description = "用户ID", example = "1780000000000000000")
    private String uid;

    /**
     * 登录名，不可改
     */
    @Schema(description = "登录账号", example = "admin")
    private String uname;

    /**
     * 用户昵称，可改
     */
    @Schema(description = "用户昵称", example = "管理员")
    private String nick;

    /**
     * 已加密的登录密码
     */
    @Schema(description = "登录密码；新增或重置时传明文，保存时会加密", example = "123456")
    private String pwd;

    /**
     * 加密盐值
     */
    @Schema(description = "密码加密盐值，后端维护")
    private String salt;

    /**
     * 是否锁定
     */
    @TableField("`lock`")
    @Schema(description = "是否锁定：true锁定、false正常", example = "false")
    private Boolean lock;

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

    /**
     * 租户标识
     */
    @Schema(description = "租户标识", example = "1")
    private Long tenantId;

    @TableField(exist = false)
    @Schema(description = "用户角色列表，响应字段", hidden = true)
    private List<SysRole> roleList = new ArrayList<>();    //用户所有角色值，在管理后台显示用户的角色
    @TableField(exist = false)
    @Schema(description = "用户角色授权集合，响应字段", hidden = true)
    private Set<AuthVo> roles = new HashSet<>();    //用户所有角色值，用于shiro做角色权限的判断
    @TableField(exist = false)
    @Schema(description = "用户权限授权集合，响应字段", hidden = true)
    private Set<AuthVo> perms = new HashSet<>();    //用户所有权限值，用于shiro做资源权限的判断
}
