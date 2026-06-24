package com.lu.admin.common.shiro;

import com.alibaba.fastjson2.JSON;
import com.lu.admin.base.BaseResponse;
import com.lu.admin.common.constant.Codes;
import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;

import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class ShiroAuthFilter extends FormAuthenticationFilter {

    @Override
    protected boolean onAccessDenied(ServletRequest request, ServletResponse response) throws IOException {
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        httpServletResponse.setStatus(200);
        httpServletResponse.setContentType("application/json;charset=UTF-8");

        BaseResponse baseResponse = new BaseResponse(Codes.SESSION_TIMEOUT, "登录已过期，请重新登录");
        httpServletResponse.getWriter().write(JSON.toJSONString(baseResponse));
        return false;
    }
}