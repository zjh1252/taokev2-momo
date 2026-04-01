package com.taoke.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 用户状态变更请求（冻结/解冻）。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Data
public class UpdateUserStatusRequest {

    /** 目标状态：0=冻结, 1=正常 */
    @NotNull(message = "状态不能为空")
    private Integer status;

    /** 冻结原因（冻结时必填） */
    private String freezeReason;
}
