package com.lu.admin.base;

import com.baomidou.mybatisplus.annotation.TableLogic;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class BaseEntityNoId implements Serializable {

    private static final long serialVersionUID = 1L;

    private Date createTime;

    private Date updateTime;

    @TableLogic
    private Integer deleted;
}
