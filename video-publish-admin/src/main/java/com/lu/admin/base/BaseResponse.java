package com.lu.admin.base;

public class BaseResponse {
    private int code = 0;
    private String msg = "操作成功";

    public BaseResponse(int code, String message) {
        this.code = code;
        this.msg = message;
    }
    public BaseResponse() {}

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }
}
