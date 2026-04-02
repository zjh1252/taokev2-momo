package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 驳回申请请求体。
 *
 * @author Fangxinxin
 * @date 2026-04-02 10:00
 */
@Data
public class RejectApplicationRequest {

    @NotBlank(message = "驳回原因不能为空")
    private String reason;
}
