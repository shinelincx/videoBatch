package com.lu.admin.common.core;

import com.lu.admin.common.config.AesConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice
public class RespBodyAdvice implements ResponseBodyAdvice {
    private final Logger log = LoggerFactory.getLogger(RespBodyAdvice.class);
    private static final String CRYPT_DATA = "cryptData";

    @Autowired
    private AesConfig aesConfig;

    @Override
    public boolean supports(MethodParameter methodParameter, Class aClass) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter methodParameter, MediaType mediaType, Class aClass, ServerHttpRequest serverHttpRequest, ServerHttpResponse serverHttpResponse) {
        // 不加密
//        if(methodParameter.getContainingClass().isAnnotationPresent(IgnoreAESEncrypt.class)){
//            IgnoreAESEncrypt annotation = methodParameter.getContainingClass().getAnnotation(IgnoreAESEncrypt.class);
//            if (annotation != null) {
//                return body;
//            }
//        }
//        else if (methodParameter.getMethod().isAnnotationPresent(IgnoreAESEncrypt.class)) {
//            IgnoreAESEncrypt annotation = methodParameter.getMethodAnnotation(IgnoreAESEncrypt.class);
//            if (annotation != null) {
//                return body;
//            }
//        }
//        ObjectMapper objectMapper = new ObjectMapper();
//        try {
//            String result = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(body);
//            JSONObject resultJson = JSON.parseObject(result);
//            if (resultJson != null) {
//                byte[] encryptedData = AESUtil.encrypt(resultJson.toJSONString().getBytes(), aesConfig.getKey().getBytes(), aesConfig.getIv().getBytes());
//                return Hex.encodeToString(encryptedData);
//            }
//        } catch (Exception e) {
//            log.error("【结果集加密】异常 | 原因：{}" + e.getMessage());
//        }
        return body;
    }
}