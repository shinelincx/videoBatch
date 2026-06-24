package com.lu.admin.base;

import java.util.HashMap;
import java.util.Map;


public class ObjectRestResponse<T> extends BaseResponse {

    T data;

    public ObjectRestResponse data(T data) {
        this.setData(data);
        return this;
    }

    public ObjectRestResponse data(String key, T data) {
        if(this.data == null){
            Map<String, Object> obj = new HashMap<>();
            obj.put(key, data);
            this.setData((T) obj);
        }else {
            Map<String, Object> map = (Map) this.data;
            map.put(key, data);
        }
        return this;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public ObjectRestResponse code(int code) {
        this.setCode(code);
        return this;
    }

    public ObjectRestResponse msg(String msg) {
        this.setMsg(msg);
        return this;
    }
}
