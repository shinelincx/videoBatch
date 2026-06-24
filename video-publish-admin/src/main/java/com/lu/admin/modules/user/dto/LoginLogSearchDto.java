package com.lu.admin.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Date;

@Data
@Schema(description = "登录日志查询条件")
public class LoginLogSearchDto {
    @Schema(description = "用户昵称")
    private String nickName;

    @Schema(description = "开始时间")
    private Date startTime;

    @Schema(description = "结束时间")
    private Date endTime;
}
