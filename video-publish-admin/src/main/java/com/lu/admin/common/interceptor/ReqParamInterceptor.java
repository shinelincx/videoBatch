package com.lu.admin.common.interceptor;

import com.lu.admin.common.annotation.IgnoreAESEncrypt;
import com.lu.admin.common.config.AesConfig;
import com.lu.admin.common.exception.BaseExceptionEnum;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.SignUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@Component
public class ReqParamInterceptor extends HandlerInterceptorAdapter {
    private final Logger log = LoggerFactory.getLogger(this.getClass());
    private final static String SIGNATURE = "signature";
    private final static String TIMESTAMP = "timestamp";
    private final static String NONCE_STR = "nonceStr";
    private final static String URI = "uri";
    private static final int EXPIRE_TIME = 60;

    @Autowired
    private AesConfig aesConfig;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        if (HttpMethod.OPTIONS.matches(method)) {
            return super.preHandle(request, response, handler);
        }
        HandlerMethod handlerMethod;
        if (handler instanceof HandlerMethod) {
            handlerMethod = (HandlerMethod) handler;
        } else {
            return super.preHandle(request, response, handler);
        }
        IgnoreAESEncrypt annotation = handlerMethod.getBeanType().getAnnotation(IgnoreAESEncrypt.class);
        if (annotation == null) {
            annotation = handlerMethod.getMethodAnnotation(IgnoreAESEncrypt.class);
        }
        // 不解密
        if (annotation != null) {
            return true;
        }
        final String signature = request.getHeader(SIGNATURE);
        final String timestamp = request.getHeader(TIMESTAMP);
        final String nonceStr = request.getHeader(NONCE_STR);
        final String uri = request.getHeader(URI);

        log.info("signature:" + signature);
        log.info("timestamp:" + timestamp);
        log.info("nonceStr:" + nonceStr);
        log.info("uri:" + uri);
        System.out.println(request.getRemoteAddr());
        if (!"127.0.0.1".equals(request.getRemoteAddr())) {
            if (ObjectUtils.isEmpty(signature) || ObjectUtils.isEmpty(timestamp) || ObjectUtils.isEmpty(nonceStr) || ObjectUtils.isEmpty(uri)) {
                log.error("【参数校验】校验不通过 | 原因：参数为空");
                throw new BizException(BaseExceptionEnum.LACK_PARAM.getMsg(), BaseExceptionEnum.LACK_PARAM.getCode());
            }
        }

        // 非法请求
        String requestUri = normalizeUri(request.getRequestURI(), request.getContextPath());
        String headerUri = normalizeUri(uri, request.getContextPath());
        if (!"127.0.0.1".equals(request.getRemoteAddr()) && !requestUri.equals(headerUri)) {
            log.error("【参数校验】校验不通过 | 原因：非法URI ->".concat(request.getRequestURI()).concat(":").concat(uri));
            throw new BizException(BaseExceptionEnum.URI_ERROR.getMsg(), BaseExceptionEnum.URI_ERROR.getCode());
        }
        Map<String, String> checkMap = new HashMap<>();
        checkMap.put(TIMESTAMP, timestamp);
        checkMap.put(NONCE_STR, nonceStr);
        checkMap.put(URI, headerUri);
        String authSignature = SignUtil.getSign(checkMap, aesConfig.getSignKey());


        // 签名验证不通过
        if (!"127.0.0.1".equals(request.getRemoteAddr()) && !authSignature.equals(signature)) {
            log.error("【参数校验】校验不通过 | 原因：验签失败 -> " + authSignature + ":" + signature);
            throw new BizException(BaseExceptionEnum.SIGN_ERROR.getMsg(), BaseExceptionEnum.SIGN_ERROR.getCode());
        }
        return true;
    }

    private String normalizeUri(String uri, String contextPath) {
        if (ObjectUtils.isEmpty(uri)) {
            return "";
        }
        String normalized = uri;
        if (!ObjectUtils.isEmpty(contextPath) && normalized.startsWith(contextPath)) {
            normalized = normalized.substring(contextPath.length());
        }
        if (normalized.startsWith("/api/")) {
            normalized = normalized.substring(4);
        } else if ("/api".equals(normalized)) {
            normalized = "/";
        }
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return ObjectUtils.isEmpty(normalized) ? "/" : normalized;
    }

    /**
     * @param request request
     * @return 转化为Map的请求参数
     */
    private Map<String, String> request2HashMap(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Map requestParams = request.getParameterMap();
        for (Iterator iterator = requestParams.keySet().iterator(); iterator.hasNext(); ) {
            String name = (String) iterator.next();
            String[] values = (String[]) requestParams.get(name);
            String valueStr = "";
            for (int i = 0; i < values.length; i++) {
                valueStr = (i == values.length - 1) ? valueStr + values[i] : valueStr + values[i] + ",";
            }
            params.put(name, valueStr);
        }
        return params;
    }
}
