package com.lu.admin.modules.sys.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.constant.Root;
import com.lu.admin.common.core.MyPageMap;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.sys.dto.SysUserDeleteRequest;
import com.lu.admin.modules.sys.dto.SysUserPasswordRequest;
import com.lu.admin.modules.sys.dto.SysUserQueryRequest;
import com.lu.admin.modules.sys.dto.SysUserRoleRequest;
import com.lu.admin.modules.sys.entity.SysUser;
import com.lu.admin.modules.sys.entity.SysUserRole;
import com.lu.admin.modules.sys.service.SysRoleBiz;
import com.lu.admin.modules.sys.service.SysUserBiz;
import com.lu.admin.modules.sys.service.SysUserRoleBiz;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sys_user")
public class SysUserController {

    private static final Logger log = LoggerFactory.getLogger(SysUserController.class);

    @Autowired
    private SysUserBiz sysUserService;
    @Autowired
    private SysRoleBiz sysRoleService;
    @Autowired
    private SysUserRoleBiz sysUserRoleService;

    @PostMapping
    public ObjectRestResponse add(@RequestBody SysUser user) {
        if (ObjectUtils.isEmpty(user.getUname())) {
            throw new BizException("用户帐号名不能为空");
        }
        if (ObjectUtils.isEmpty(user.getPwd())) {
            throw new BizException("密码不能为空");
        }

        SysUser userDB = sysUserService.getOne(new QueryWrapper<SysUser>().eq("uname", user.getUname()));
        if (userDB != null) {
            throw new BizException("用户已注册");
        }

        //密码加密
        RandomNumberGenerator saltGen = new SecureRandomNumberGenerator();
        String salt = saltGen.nextBytes().toBase64();
        String hashedPwd = new Sha256Hash(user.getPwd(), salt, 1024).toBase64();
        //保存新用户数据
        user.setPwd(hashedPwd);
        user.setSalt(salt);
        user.setCreated(new Date());
        user.setUid(String.valueOf(IdWorker.getId()));
        boolean success = sysUserService.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("uid", user.getUid());
        result.put("created", user.getCreated());

        return new ObjectRestResponse().data(result);
    }

    @DeleteMapping
    public ObjectRestResponse delete(@RequestBody SysUserDeleteRequest request) {

        String oper = "delete user";
        log.info("{}, request: {}",oper,request);

        String uid = request == null ? null : request.getUid();
        if (ObjectUtils.isEmpty(uid)) {
            throw new BizException("无法删除用户：参数为空（用户id）");
        }

        //限制：不能删当前登录用户
        SysUser user = (SysUser) SecurityUtils.getSubject().getPrincipal();
        if (ObjectUtils.nullSafeEquals(uid, user.getUid())){
            throw new BizException("系统限制：不能删除当前登录账号");
        }

        //检查：不能删除管理员
        boolean containRoot = sysRoleService.checkUidContainRval(uid, Root.ROLE_VAL);
        if (containRoot){
            throw new BizException("不能删除管理员用户");
        }

        boolean success = sysUserService.removeById(uid);
        QueryWrapper<SysUserRole> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", uid);
        sysUserRoleService.remove(wrapper);
        return new ObjectRestResponse().data(success);
    }

    @PatchMapping("/role")
    public ObjectRestResponse updateUserRole(@RequestBody SysUserRoleRequest request) {
        final String uid = request == null ? null : request.getUid();
        List<String> rids = request == null || request.getRids() == null ? java.util.Collections.emptyList() : request.getRids();

        //检查：不能含有管理员角色
        boolean containRoot = sysRoleService.checkRidsContainRval(rids, Root.ROLE_VAL);
        if (containRoot){
            throw new BizException("不能给非管理员用户赋予管理员角色");
        }
        QueryWrapper<SysUserRole> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", uid);
        //删除：原来绑定的角色
        boolean deleteSucc = sysUserRoleService.remove(wrapper);

        //更新：绑定新的角色
        List<SysUserRole> list = rids.stream().map(roleId -> new SysUserRole(uid, roleId)).collect(Collectors.toList());

        if (!rids.isEmpty()){
            boolean addSucc = sysUserRoleService.saveBatch(list);
            return new ObjectRestResponse().data(addSucc);
        }

        return new ObjectRestResponse();
    }

    @PostMapping("/query")
    public ObjectRestResponse query(@RequestBody SysUserQueryRequest request) {
        String nick = request == null ? null : request.getNick();
        IPage<SysUser> page = sysUserService.queryUserIncludeRoles(
                new MyPageMap<>(request == null ? new HashMap<>() : request.toMap()),
                nick,
                TenantUtils.currentTenantId());
        return new ObjectRestResponse().data("page", page);
    }

    @GetMapping("/info")
    public ObjectRestResponse userInfo() {
        String oper = "query user info";
        log.info("{}", oper);
        Object userInfo = SecurityUtils.getSubject().getPrincipal();
        return new ObjectRestResponse().data("userInfo", userInfo);
    }

    @PatchMapping("/info")
    public ObjectRestResponse update(@RequestBody SysUser user) {

        String oper = "update user";
        log.info("{}, user: {}", oper, user);

        if (!ObjectUtils.isEmpty(user.getPwd())){
            //密码加密
            RandomNumberGenerator saltGen = new SecureRandomNumberGenerator();
            String salt = saltGen.nextBytes().toBase64();
            String hashedPwd = new Sha256Hash(user.getPwd(), salt, 1024).toBase64();
            user.setPwd(hashedPwd);
            user.setSalt(salt);
        }else{
            user.setPwd(null);
            user.setSalt(null);
        }

        user.setUname(null);
        user.setCreated(null);
        user.setUpdated(new Date());

        sysUserService.updateById(user);
        return new ObjectRestResponse().data("updated",user.getUpdated());
    }

    @PatchMapping("/pwd")
    public ObjectRestResponse updatePwd(@RequestBody SysUserPasswordRequest request) {

        String oper = "update pwd";
        log.info("{}, request: {}", oper, request);

        String pwd = request == null ? null : request.getPwd();

        if (ObjectUtils.isEmpty(pwd)) {
            throw new BizException("无法更新密码：密码为空");
        }
        //密码加密
        RandomNumberGenerator saltGen = new SecureRandomNumberGenerator();
        String salt = saltGen.nextBytes().toBase64();
        String hashedPwd = new Sha256Hash(pwd, salt, 1024).toBase64();
        SysUser currentUser = (SysUser) SecurityUtils.getSubject().getPrincipal();

        SysUser updateData = new SysUser();
        updateData.setUid(currentUser.getUid());
        updateData.setPwd(hashedPwd);
        updateData.setSalt(salt);
        updateData.setUpdated(new Date());
        sysUserService.updateById(updateData);
        return new ObjectRestResponse().data("updated", updateData.getUpdated());
    }

    @GetMapping("/{uid}/roles")
    public ObjectRestResponse findUserRoles(@PathVariable String uid){
        String oper = "find user roles";
        log.info("{}, uid: {}", oper, uid);
        if (ObjectUtils.isEmpty(uid)){
            throw new BizException("无法查询当前用户的角色值：参数为空（用户id）");
        }
        List<String> rids = sysRoleService.getRoleIdsByUserId(uid);
        return new ObjectRestResponse().data("rids",rids);
    }

}
