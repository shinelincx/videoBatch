package com.lu.admin.modules.selection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "选品记录批量操作请求")
public class SelectionRecordBatchRequest {

    @Schema(description = "选品记录ID列表", example = "[1,2,3]")
    private List<Long> ids;

}
