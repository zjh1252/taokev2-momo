package com.taoke.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 站内信通知类型枚举。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Getter
@AllArgsConstructor
public enum NotificationType {

    SYSTEM("系统公告"),
    WELCOME("欢迎通知"),
    APPLY_RESULT("申请审核结果"),
    ORDER("订单通知"),
    COMMENT("评论通知");

    private final String label;
}
