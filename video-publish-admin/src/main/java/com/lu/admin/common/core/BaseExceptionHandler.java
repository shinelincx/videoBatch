package com.lu.admin.common.core;


import com.lu.admin.base.BaseResponse;
import com.lu.admin.common.constant.Codes;
import com.lu.admin.common.exception.BizException;
import org.apache.shiro.ShiroException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.servlet.http.HttpServletResponse;

/**
 * 业务异常处理器
 */
@RestControllerAdvice
public class BaseExceptionHandler {
    private Logger logger = LoggerFactory.getLogger(getClass());

    @ExceptionHandler(ShiroException.class)
    @ResponseBody
    public BaseResponse handleShiroException(ShiroException e) {
        String eName = e.getClass().getSimpleName();
        logger.error("shiro执行出错：{}", eName);
        return new BaseResponse(Codes.SHIRO_ERR, "系统异常，请联系管理员");
    }

    /**
     * 处理系统异常
     */
    @ExceptionHandler(Exception.class)
    public BaseResponse handleRRException(HttpServletResponse response, Exception ex) {
        logger.error(ex.getMessage(), ex);
        response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "系统异常，请联系管理员");
    }


    /**
     * 处理业务异常
     */
    @ExceptionHandler(BizException.class)
    public BaseResponse handleRRException(HttpServletResponse response, BizException ex) {
        response.setStatus(HttpStatus.OK.value());
        return new BaseResponse(ex.getCode(), ex.getMessage());
    }


}
