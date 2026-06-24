package com.lu.admin.modules.sys.controller;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.constant.PermType;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.modules.sys.dto.SysRoleDeleteRequest;
import com.lu.admin.modules.sys.dto.SysRolePermRequest;
import com.lu.admin.modules.sys.dto.SysRoleQueryRequest;
import com.lu.admin.modules.sys.entity.SysPerm;
import com.lu.admin.modules.sys.entity.SysRole;
import com.lu.admin.modules.sys.entity.SysRolePerm;
import com.lu.admin.modules.sys.service.SysPermBiz;
import com.lu.admin.modules.sys.service.SysRoleBiz;
import com.lu.admin.modules.sys.service.SysRolePermBiz;
import com.lu.admin.modules.sys.service.SysUserRoleBiz;
import com.lu.admin.modules.sys.vo.UpdateRolePermVo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sys_role")
public class SysRoleController {

    private static final Logger log = LoggerFactory.getLogger(SysRoleController.class);

    @Autowired
    private SysRoleBiz roleService;
    @Autowired
    private SysPermBiz permService;
    @Autowired
    private SysUserRoleBiz userRoleService;
    @Autowired
    private SysRolePermBiz rolePermService;

    @PostMapping
    public ObjectRestResponse add(@RequestBody SysRole role) {
        if (ObjectUtils.isEmpty(role.getRval())) {
            return new ObjectRestResponse().data("权限值不能为空");
        }

        QueryWrapper<SysRole> wrapper = new QueryWrapper<>();
        wrapper.eq("rval", role.getRval());
        SysRole roleDB = roleService.getOne(wrapper);
        if (roleDB != null) {
            return new ObjectRestResponse().data("角色值已存在：" + role.getRval());
        }

        //保存新用户数据
        role.setCreated(new Date());
        role.setRid(String.valueOf(IdWorker.getId()));
        roleService.save(role);
        return new ObjectRestResponse()
                .data("rid", role.getRid())
                .data("created", role.getCreated());
    }

    @DeleteMapping
    public ObjectRestResponse delete(@RequestBody SysRoleDeleteRequest request) {
        String rid = request == null ? null : request.getRid();
        if (ObjectUtils.isEmpty(rid)) {
            throw new BizException("无法删除角色：参数为空（角色id）");
        }
        boolean success = roleService.removeById(rid);
        return new ObjectRestResponse().data(success);
    }

    @PostMapping("/query")
    public ObjectRestResponse query(@RequestBody SysRoleQueryRequest request) {
        String rname = request == null ? null : request.getRname();
        int current = request == null ? 1 : request.pageCurrent();
        int size = request == null ? 10 : request.pageSize();

        QueryWrapper<SysRole> queryParams = new QueryWrapper<>();
        queryParams.orderByDesc("created", "updated");
        if (!ObjectUtils.isEmpty(rname)) {
            queryParams.like("rname", rname);
        }
        IPage<SysRole> page = roleService.page(new Page<>(current, size), queryParams);
        return new ObjectRestResponse().data("page", page);
    }

    @PatchMapping("/info")
    public ObjectRestResponse update(@RequestBody SysRole role) {
        if (ObjectUtils.isEmpty(role.getRid())) {
            throw new BizException("无法更新角色：参数为空（角色id）");
        }
        role.setUpdated(new Date());
        roleService.updateById(role);
        return new ObjectRestResponse().data("updated", role.getUpdated());
    }


    @PatchMapping("/perm")
    public ObjectRestResponse updateRolePerm(@RequestBody UpdateRolePermVo vo) {
        if (ObjectUtils.isEmpty(vo.getRid())) {
            throw new BizException("无法更新角色的权限：参数为空（角色id）");
        }
        if (vo.getPtype() == null) {
            throw new BizException("无法更新角色的权限：参数为空（权限类型）");
        }
        final String rid = vo.getRid();
        final Integer ptype = vo.getPtype();
        final List<String> pvals = vo.getPvals() == null ? new ArrayList<>() : vo.getPvals();

        Wrapper<SysRolePerm> deleteRelationParam = new QueryWrapper<SysRolePerm>().eq("role_id", rid).eq("perm_type", ptype);
        boolean deleteRelationSucc = rolePermService.remove(deleteRelationParam);
        if (!pvals.isEmpty()) {
            List<SysRolePerm> list = pvals.stream().map(pval -> new SysRolePerm(rid, pval, ptype)).collect(Collectors.toList());
            boolean addSucc = rolePermService.saveBatch(list);
            return new ObjectRestResponse().data(addSucc);
        }
        return new ObjectRestResponse();
    }


    @PostMapping("/perm")
    public ObjectRestResponse addPerm(@RequestBody SysRolePermRequest request) {
        String rid = request == null ? null : request.getRid();
        Integer ptype = request == null ? null : request.getPtype();
        String pval = request == null ? null : request.getPval();
        boolean success = rolePermService.save(new SysRolePerm(rid, pval, ptype));
        return new ObjectRestResponse().data(success);
    }


    @DeleteMapping("/perm")
    public ObjectRestResponse deletePerm(@RequestBody SysRolePermRequest request) {
        String oper = "delete role's permissions";

        String rid = request == null ? null : request.getRid();
        Integer ptype = request == null ? null : request.getPtype();
        String pval = request == null ? null : request.getPval();

        Wrapper<SysRolePerm> deleteParam = new QueryWrapper<SysRolePerm>()
                .eq("role_id", rid)
                .eq("perm_val", pval)
                .eq("perm_type", ptype);
        boolean success = rolePermService.remove(deleteParam);
        return new ObjectRestResponse().data(success);
    }


    @GetMapping("/{rid}/perms")
    public ObjectRestResponse findRolePerms(@PathVariable String rid) {
        if (ObjectUtils.isEmpty(rid)) {
            throw new BizException("无法查询当前角色的权限值：参数为空（角色id）");
        }
        SysRole role = roleService.getById(rid);
        List<SysPerm> perms = permService.getPermsByRoleId(rid);
        Map<Integer, List<SysPerm>> permMap = perms.stream().collect(Collectors.groupingBy(SysPerm::getPtype));

        List<String> menuPvals = permMap.getOrDefault(PermType.MENU, new ArrayList<>()).stream()
                .filter(perm -> perm.getLeaf() == true).map(SysPerm::getPval).collect(Collectors.toList());

        List<String> btnPvals = permMap.getOrDefault(PermType.BUTTON, new ArrayList<>()).stream()
                .map(SysPerm::getPval).collect(Collectors.toList());

        List<String> apiPvals = permMap.getOrDefault(PermType.API, new ArrayList<>()).stream()
                .filter(perm -> perm.getLeaf() == true).map(SysPerm::getPval).collect(Collectors.toList());

        return new ObjectRestResponse()
                .data("role", role)
                .data("menuPvals", menuPvals)
                .data("btnPvals", btnPvals)
                .data("apiPvals", apiPvals);
    }

}
