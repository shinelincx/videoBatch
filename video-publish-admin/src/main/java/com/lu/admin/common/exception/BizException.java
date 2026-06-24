package com.lu.admin.common.exception;

/**
 * @description: 业务异常
 * @Auther im
 * @Date Created in 15:58 2018/05/07.
 */
public class BizException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private String msg;
    private int code = -1;

    public BizException(String msg) {
        super(msg);
        this.msg = msg;
    }

    public BizException(String msg, int code) {
        super(msg);
        this.msg = msg;
        this.code = code;
    }

    public String getMsg() {
        return this.msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public int getCode() {
        return this.code;
    }

    public void setCode(int code) {
        this.code = code;
    }
}