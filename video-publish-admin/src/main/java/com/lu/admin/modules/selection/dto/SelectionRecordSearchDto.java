package com.lu.admin.modules.selection.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lu.admin.modules.selection.entity.SelectionRecord;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "选品记录分页查询条件")
public class SelectionRecordSearchDto extends SelectionRecord {

    @Schema(description = "创建时间开始", example = "2026-05-24 00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @Schema(description = "创建时间结束", example = "2026-05-24 23:59:59")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    @Schema(description = "选品时间开始", example = "2026-05-24 00:00:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime selectionStartTime;

    @Schema(description = "选品时间结束", example = "2026-05-24 23:59:59")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime selectionEndTime;
}
