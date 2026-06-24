package com.lu.admin.common.core;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class MyPageMap<T> extends Page<T> {

    private Map params;

    public MyPageMap(Map params){
        super(1, 50);
        if(params.get("current") != null){
            this.setCurrent(Long.parseLong(params.get("current").toString()));
        }
        if(params.get("size") != null){
            this.setSize(Long.parseLong(params.get("size").toString()));
        }

        this.params = new HashMap<>();
        this.params.putAll(params);
    }

    
    public int size() {
        return this.params.size();
    }

    
    public boolean isEmpty() {
        return this.params.isEmpty();
    }

    
    public boolean containsKey(Object key) {
        return this.params.containsKey(key);
    }

    
    public boolean containsValue(Object value) {
        return this.params.containsValue(value);
    }

    
    public Object get(Object key) {
        return null;
    }

    
    public Object put(Object key, Object value) {
        return null;
    }

    
    public Object remove(Object key) {
        return this.params.remove(key);
    }

    
    public void putAll(Map m) {
        this.params.putAll(m);
    }


    
    public void clear() {
        this.params.clear();
    }

    
    public Set<T> keySet() {
        return this.params.keySet();
    }

    
    public Collection<T> values() {
        return this.params.values();
    }

    
//    public Set<Entry<T, T>> entrySet() {
//        return this.params.entrySet();
//    }


}
