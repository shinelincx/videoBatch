package com.lu.admin.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * @Description 加解密参数配置
 * @Date 2019/1/21 2:15 PM
 */
@Component
public class AesConfig {

    @Value("${aes.key}")
    private String key;

    @Value("${aes.iv}")
    private String iv;

    @Value("${aes.signKey}")
    private String signKey;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }

    public String getSignKey() {
        return signKey;
    }

    public void setSignKey(String signKey) {
        this.signKey = signKey;
    }
}
