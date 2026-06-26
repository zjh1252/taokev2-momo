package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 广播系统公告请求体。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Data
public class BroadcastNotificationRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    /** 点击跳转路径（可选） */
    private String relatedUrl;
}
