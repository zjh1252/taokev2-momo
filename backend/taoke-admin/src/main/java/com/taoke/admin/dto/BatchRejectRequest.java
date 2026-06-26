package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 批量驳回请求体
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BatchRejectRequest extends BatchIdsRequest {

    @NotBlank(message = "驳回原因不能为空")
    private String reason;
}
