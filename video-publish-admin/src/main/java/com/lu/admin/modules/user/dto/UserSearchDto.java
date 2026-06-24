package com.lu.admin.modules.user.dto;

import com.lu.admin.modules.user.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Date;

@Data
@Schema(description = "用户查询条件")
public class UserSearchDto extends User {
    @Schema(description = "开始时间")
    private Date startTime;

    @Schema(description = "结束时间")
    private Date endTime;
}
