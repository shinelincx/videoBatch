package com.lu.admin.common.interceptor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class LoggerValidateInterceptor extends HandlerInterceptorAdapter {

    private final Logger log = LoggerFactory.getLogger(this.getClass());

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
//        SysUser user = ShiroUtils.getSysUser();
//        String userName = "未知";
//        if(user != null){
//            userName = user.getUname();
//
//        }
//        Map<String, String[]> params = request.getParameterMap();
//        String uri = request.getRequestURI();
//        this.log.info(userName + "调用接口:" + uri
//                + "，IP:" + IPUtil.getRemoteIp(request)
//                + "，参数:" + JSONObject.toJSONString(params));
        return true;
    }

}
