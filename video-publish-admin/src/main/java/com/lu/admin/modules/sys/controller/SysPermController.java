package com.lu.admin.modules.sys.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.annotation.PermInfo;
import com.lu.admin.common.constant.PermType;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.modules.sys.dto.SysPermDeleteRequest;
import com.lu.admin.modules.sys.entity.SysPerm;
import com.lu.admin.modules.sys.service.SysPermBiz;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Controller;
import org.springframework.util.ClassUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sys_perm")
public class SysPermController {

    private static final Logger log = LoggerFactory.getLogger(SysPermController.class);

    @Autowired
    private SysPermBiz permService;

    @GetMapping("/list/all")
    public ObjectRestResponse listAllPermission() {
        QueryWrapper<SysPerm> params = new QueryWrapper<>();
        params.in("ptype", new Integer[]{PermType.MENU, PermType.BUTTON, PermType.API});
        List<SysPerm> list = permService.list(params);
//        list = new ArrayList<>();
        if (list.isEmpty()){
            return new ObjectRestResponse();
        }else{
            Map<Integer, List<SysPerm>> permMap = list.stream().collect(Collectors.groupingBy(SysPerm::getPtype));
            List<SysPerm> buttonPermList = permMap.get(PermType.BUTTON);
            Map<String, List<SysPerm>> buttonsGroupedByParent = new HashMap<>();
            if (buttonPermList!=null&&!buttonPermList.isEmpty()){
                buttonsGroupedByParent = buttonPermList.stream().collect(Collectors.groupingBy(SysPerm::getParent));
            }
            return new ObjectRestResponse().data("permMap", permMap).data("btnPermMap", buttonsGroupedByParent);
        }
    }

    @GetMapping("/list/btn_perm_map")
    public ObjectRestResponse listButtonPermMapGroupByParent() {
        String oper = "list btn perm map group by parent";
        QueryWrapper<SysPerm> params = new QueryWrapper<>();
        params.eq("ptype", PermType.BUTTON);
        List<SysPerm> buttonPermList = permService.list(params);
        Map<String, List<SysPerm>> buttonsGroupedByParent = new HashMap<>();
        if (buttonPermList!=null&&!buttonPermList.isEmpty()){
            buttonsGroupedByParent = buttonPermList.stream().collect(Collectors.groupingBy(SysPerm::getParent));
        }
        return new ObjectRestResponse().data("btnPermMap", buttonsGroupedByParent);
    }

    @PostMapping("/sync/menu")
    public ObjectRestResponse syncMenuPermission(@RequestBody List<SysPerm> notSyncedPerms) {
        if (notSyncedPerms != null && !notSyncedPerms.isEmpty()){
            permService.remove(new QueryWrapper<SysPerm>().eq("ptype",PermType.MENU));
            permService.saveOrUpdate(notSyncedPerms);
        }
        return new ObjectRestResponse();
    }

    @PostMapping("/sync/api")
    public ObjectRestResponse syncApiPermission(@RequestBody List<SysPerm> notSyncedPerms) {
        if (notSyncedPerms != null && !notSyncedPerms.isEmpty()){
            permService.remove(new QueryWrapper<SysPerm>().eq("ptype",PermType.API));
            permService.saveOrUpdate(notSyncedPerms);
        }
        return new ObjectRestResponse();
    }

    @PostMapping
    public ObjectRestResponse add(@RequestBody SysPerm perm) {
        if (StringUtils.isEmpty(perm.getPval())) {
            throw new BizException("权限值不能为空");
        }
        QueryWrapper<SysPerm> params = new QueryWrapper<>();
        params.eq("pval", perm.getPval());
        params.select("pname,pval");
        SysPerm permDB = permService.getOne(params);

        if (permDB != null) {
            throw new BizException("权限值已存在：" + permDB.getPname() + "（" + perm.getPval() + "）");
        }

        //保存
        perm.setCreated(new Date());
        this.permService.save(perm);
        return new ObjectRestResponse().data("created", perm.getCreated());
    }

    @DeleteMapping
    public ObjectRestResponse delete(@RequestBody SysPermDeleteRequest request) {
        String oper = "delete permission";
        log.info("{}, request: {}", oper, request);
        String pval = request == null ? null : request.getPval();
        if (StringUtils.isEmpty(pval)) {
            throw new BizException("无法删除权限：参数为空（权限值）");
        }
        boolean success = permService.removeById(pval);
        return new ObjectRestResponse();
    }

    @PatchMapping("/info")
    public ObjectRestResponse update(@RequestBody SysPerm perm) {

        String oper = "update permission";
        log.info("{}, perm: {}", oper, perm);
        if (StringUtils.isEmpty(perm.getPval())) {
            throw new BizException("无法删除权限：参数为空（权限值）");
        }

        SysPerm updateData = new SysPerm();
        updateData.setPval(perm.getPval());
        updateData.setPname(perm.getPname());
        updateData.setUpdated(new Date());
        boolean success = permService.updateById(updateData);
        return new ObjectRestResponse().data("updated", updateData.getUpdated());
    }


    @Autowired
    private ApplicationContext context;

    @GetMapping("/meta/api")
    public ObjectRestResponse listApiPermMetadata() {
        String oper = "list api permission metadata";
        log.info(oper);
        final String basicPackage = ClassUtils.getPackageName(this.getClass());
        Map<String, Object> map = context.getBeansWithAnnotation(Controller.class);
        Collection<Object> beans = map.values();
        List<SysPerm> apiList = beans.stream().filter(b -> StringUtils.pathEquals(basicPackage, ClassUtils.getPackageName(b.getClass()))).map(bean -> {
            Class<?> clz = bean.getClass();
            SysPerm moduleApiPerm = getModulePerm(clz);
            List<SysPerm> methodApiPerm = getApiPerm(clz, moduleApiPerm.getPval());
            moduleApiPerm.getChildren().addAll(methodApiPerm);
            return moduleApiPerm;
        }).collect(Collectors.toList());
        return new ObjectRestResponse().data("apiList", new ArrayList<>());
    }

    /**
     * 获取控制器上的方法上的注释，生成后台接口权限的信息
     *
     * @param clz
     * @return
     */
    private List<SysPerm> getApiPerm(Class<?> clz,final String parentPval) {
        //获取clz类上有RequiresPermissions注解的所有方法
        List<Method> apiMethods = getMethodsWithAnnotation(clz.getSuperclass(), RequiresPermissions.class);
        return apiMethods.stream().map(method -> {
            //pname首选
            //获取method方法上的PermInfo注解的元数据
            PermInfo piAnno = AnnotationUtils.getAnnotation(method, PermInfo.class);
            String pnamePrimary = piAnno!=null?piAnno.value():null;
            //pname备选
            String pnameSub = method.getName();
            //pval值
            //获取method方法上的RequiresPermissions注解的元数据
            RequiresPermissions rpAnno = AnnotationUtils.getAnnotation(method, RequiresPermissions.class);
            SysPerm perm = new SysPerm();
            if (!ObjectUtils.isEmpty(pnamePrimary)){
                perm.setPname(pnamePrimary);
            }else{
                perm.setPname(pnameSub);
            }
            perm.setParent(parentPval);
            perm.setPtype(PermType.API);
            perm.setPval(rpAnno.value()[0]);
            return perm;
        }).collect(Collectors.toList());
    }

    /**
     * 获取控制器上的注释，生成后台接口模块权限的信息
     *
     * @param clz
     * @return
     */
    public SysPerm getModulePerm(Class<?> clz) {
        SysPerm perm = new SysPerm();
        //首选值
        PermInfo piAnno = AnnotationUtils.getAnnotation(clz, PermInfo.class);
        if (piAnno == null) {
            //由于使用了RequiresPermissions注解的类在运行时会使用动态代理，即clz在运行时是一个动态代理，所以需要getSuperClass获取实际的类型
            piAnno = AnnotationUtils.getAnnotation(clz.getSuperclass(), PermInfo.class);
        }
        String pnamePrimary = null;
        String pvalPrimary = null;
        String pvalPrimary2 = null;
        if (piAnno != null && piAnno.value() != null) {
            pnamePrimary = piAnno.value();
            pvalPrimary = piAnno.pval();
        }

        //备选值1
        RequiresPermissions rpAnno = AnnotationUtils.getAnnotation(clz, RequiresPermissions.class);
        if (rpAnno == null) {
            rpAnno = AnnotationUtils.getAnnotation(clz.getSuperclass(), RequiresPermissions.class);
        }
        if (rpAnno != null) {
            pvalPrimary2 = rpAnno.value()[0];
        }

        //备选值2
        String pnameSub = ClassUtils.getShortName(clz);
        RequestMapping rmAnno = AnnotationUtils.getAnnotation(clz, RequestMapping.class);
        if (rmAnno == null) {
            rmAnno = AnnotationUtils.getAnnotation(clz.getSuperclass(), RequestMapping.class);
        }
        String pvalSub = rmAnno.value()[0];
        //赋值
        if (!ObjectUtils.isEmpty(pnamePrimary)) {
            perm.setPname(pnamePrimary);
        } else {
            perm.setPname(pnameSub);
        }
        if (!ObjectUtils.isEmpty(pvalPrimary)) {
            perm.setPval(pvalPrimary);
        }else if(!ObjectUtils.isEmpty(pvalPrimary2)){
            perm.setPval(pvalPrimary2);
        } else {
            perm.setPval("a:"+pvalSub.substring(1).replace("/",":"));
        }
        perm.setPtype(PermType.API);
        return perm;
    }

    private List<Method> getMethodsWithAnnotation(Class<?> clazz, Class<? extends Annotation> annotationClass) {
        List<Method> methods = new ArrayList<>();
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(annotationClass)) {
                methods.add(method);
            }
        }
        return methods;
    }
}
