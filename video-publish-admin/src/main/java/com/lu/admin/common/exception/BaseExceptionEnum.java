package com.lu.admin.common.exception;

public enum BaseExceptionEnum {

//    EX_USER_TOKEN_EXPIRED(4001, "登录已过期"),
//    EX_USER_FORBIDDEN(4002, "格式错误"),
//    LACK_PARAM(3000, "缺少必填参数"),
//    URI_ERROR(3001, "非法URI"),
//    PARAM_EXPIRED(3002, "时间戳已过期"),
//    PARAM_REPEATED(3003, "重复请求"),
//    SIGN_ERROR(3004, "签名错误");

    EX_USER_TOKEN_MISSING(4000, "token不能为空"),
    EX_USER_TOKEN_EXPIRED(4001, "登录已过期"),
    EX_USER_TOKEN_ERROR(4002, "token不合法"),
    EX_USER_FORBIDDEN(4004, "用户被封禁"),
    LOGIN_REPEAT(4003, "请重新登录"),
    LACK_PARAM(3000, "缺少必填参数"),
    URI_ERROR(3001, "非法URI"),
    PARAM_EXPIRED(3002, "时间戳已过期"),
    PARAM_REPEATED(3003, "重复请求"),
    SIGN_ERROR(3004, "签名错误");

    private String msg;
    private int code;

    BaseExceptionEnum(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }

    public String getMsg() {
        return this.msg;
    }

    public int getCode() {
        return this.code;
    }
}
