package com.taoke.course.dto.demand;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 需求状态变更请求（管理端）
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class DemandStatusChangeRequest {

    @NotNull(message = "目标状态不能为空")
    private Integer newStatus;

    /** 变更备注 */
    private String content;
}
