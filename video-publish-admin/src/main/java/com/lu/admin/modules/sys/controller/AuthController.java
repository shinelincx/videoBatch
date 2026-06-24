package com.lu.admin.modules.sys.controller;

import com.lu.admin.base.ObjectRestResponse;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.modules.sys.dto.LoginRequest;
import com.lu.admin.modules.sys.entity.SysUser;
import com.lu.admin.modules.sys.service.SysUserBiz;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.UnauthenticatedException;
import org.apache.shiro.authz.UnauthorizedException;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.Serializable;
import java.util.UUID;


@RestController
@RequestMapping("/auth")
public class AuthController {

    private final Logger log = LoggerFactory.getLogger(this.getClass());

    /**
     * shiro.loginUrl映射到这里，我在这里直接抛出异常交给GlobalExceptionHandler来统一返回json信息，
     * 您也可以在这里直接返回json，不过这样子就跟GlobalExceptionHandler中返回的json重复了。
     * @return
     */
    @RequestMapping("/page/401")
    public ObjectRestResponse page401() {
        throw new UnauthenticatedException();
    }

    /**
     * shiro.unauthorizedUrl映射到这里。由于约定了url方式只做鉴权控制，不做权限访问控制，
     * 也就是说在ShiroConfig中如果没有做roles[js],perms[mvn:install]这样的权限访问控制配置的话，是不会跳转到这里的。
     * @return
     */
    @RequestMapping("/page/403")
    public ObjectRestResponse page403() {
        throw new UnauthorizedException();
    }

    /**
     * 登录成功跳转到这里，直接返回json。但是实际情况是在login方法中登录成功后返回json了。
     * @return
     */
    @RequestMapping("/page/index")
    public ObjectRestResponse pageIndex() {
        return new ObjectRestResponse();
    }

    @Autowired
    private SysUserBiz sysUserBiz;

    /**
     * 登录接口，由于UserService中是模拟返回用户信息的，
     * 所以用户名随意，密码123456
     *
     * @return
     */
    @PostMapping("/login")
    public ObjectRestResponse login(@RequestBody LoginRequest loginRequest, HttpServletRequest request, HttpServletResponse response){
        String uname = loginRequest == null ? null : loginRequest.getUname();
        String pwd = loginRequest == null ? null : loginRequest.getPwd();

        if (StringUtils.isEmpty(uname)){
            throw new BizException("用户名不能为空");
        }
        if (StringUtils.isEmpty(pwd)){
            throw new BizException("密码不能为空");
        }

        log.info("当前用户" + uname + "的登录IP为: " + request.getRemoteAddr());

        try {
            Subject currentUser = SecurityUtils.getSubject();
            //登录
            UsernamePasswordToken passwordToken = new UsernamePasswordToken(uname, pwd);
            currentUser.login(passwordToken);
            //从session取出用户信息
            SysUser user = (SysUser) currentUser.getPrincipal();
            if (user==null) throw new AuthenticationException();
            log.info("user login: {}, sessionId: {}",user.getUname(),currentUser.getSession().getId());
            //返回登录用户的信息给前台，含用户的所有角色和权限
            return new ObjectRestResponse()
                    .data("token", UUID.randomUUID().toString())
                    .data("uid",user.getUid())
                    .data("nick",user.getNick())
                    .data("tenantId", user.getTenantId())
                    .data("roles",user.getRoles())
                    .data("perms",user.getPerms());
        } catch ( UnknownAccountException uae ) {
            log.warn("用户帐号不正确");
            throw new BizException("用户帐号或密码不正确");
        } catch ( IncorrectCredentialsException ice ) {
            log.warn("用户密码不正确");
            throw new BizException("用户帐号或密码不正确");
        } catch ( LockedAccountException lae ) {
            log.warn("用户帐号被锁定");
            throw new BizException("用户帐号被锁定不可用");
        } catch ( AuthenticationException ae ) {
            log.warn("登录出错");
            throw new BizException("登录失败："+ae.getMessage());
        } catch (Exception e){
            e.printStackTrace();
            throw new BizException("登录异常: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ObjectRestResponse logout(){
        SecurityUtils.getSubject().logout();
        return new ObjectRestResponse();
    }

    @GetMapping("/info")
    public ObjectRestResponse info(){
        String oper = "get user info";

        Subject subject = SecurityUtils.getSubject();

        Serializable sessionId = subject.getSession().getId();
        log.info("{}, sessionId: {}",oper,sessionId);

        //从session取出用户信息
        SysUser user = (SysUser) subject.getPrincipal();
        if (user==null){
            //告知前台，登录失效
            throw new BizException("登录已失效");
        }else{
            //返回登录用户的信息给前台，含用户的所有角色和权限
            return new ObjectRestResponse()
                    .data("name",user.getUname())
                    .data("nick",user.getNick())
                    .data("tenantId", user.getTenantId())
                    .data("avator","")
                    .data("roles",user.getRoles())
                    .data("perms",user.getPerms());
        }


    }

}
