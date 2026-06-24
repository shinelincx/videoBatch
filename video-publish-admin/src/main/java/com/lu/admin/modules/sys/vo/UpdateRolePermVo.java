package com.lu.admin.modules.sys.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Schema(description = "批量更新角色权限请求参数")
public class UpdateRolePermVo implements Serializable{

    @Schema(description = "角色ID", example = "1780000000000000000")
    private String rid;

    @Schema(description = "权限类型：1菜单、2按钮、3接口、4特殊", example = "1")
    private Integer ptype;

    @Schema(description = "权限值列表")
    private List<String> pvals = new ArrayList<>();

    public Integer getPtype() {
        return ptype;
    }

    public void setPtype(Integer ptype) {
        this.ptype = ptype;
    }

    public String getRid() {
        return rid;
    }

    public void setRid(String rid) {
        this.rid = rid;
    }

    public List<String> getPvals() {
        return pvals;
    }

    public void setPvals(List<String> pvals) {
        this.pvals = pvals;
    }
}
