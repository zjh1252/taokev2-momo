package com.taoke.course.dto.demand;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 添加跟进记录请求（管理端）
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class AddFollowUpRequest {

    /** 操作类型：CS_NOTE / CONTACT_RECORD / ASSIGN_CS 等 */
    @NotBlank(message = "操作类型不能为空")
    private String action;

    /** 跟进内容 */
    @NotBlank(message = "跟进内容不能为空")
    private String content;
}
