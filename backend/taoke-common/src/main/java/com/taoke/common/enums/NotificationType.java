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
    COMMENT("评论通知"),
    VIDEO_REVIEW("录播课审核结果"),
    VIDEO_PURCHASED("录播课被购买"),
    CASE_REVIEW("案例审核结果"),
    HIGHLIGHT_REVIEW("精彩瞬间审核结果"),
    DEMAND_STATUS("需求状态变更");

    private final String label;
}
