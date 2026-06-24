package com.lu.admin.base;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "分页请求参数")
public class BasePage<T> {

    @Schema(description = "当前页码，从1开始", example = "1")
    private Long current;

    @Schema(description = "每页条数", example = "20")
    private Long size;

    @Schema(description = "查询条件")
    private T params;

    public Page createPage(){
        return new Page(this.current, this.size);
    }
}
