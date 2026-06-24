package com.lu.admin.common.annotation;

import org.springframework.web.bind.annotation.Mapping;

import java.lang.annotation.*;

@Target({ElementType.METHOD,ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Mapping
@Documented
public @interface IgnoreAESEncrypt {
}
