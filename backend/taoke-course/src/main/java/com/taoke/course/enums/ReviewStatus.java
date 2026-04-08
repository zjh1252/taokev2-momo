package com.taoke.course.enums;

import lombok.Getter;

/**
 * 评价审核状态枚举
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Getter
public enum ReviewStatus {

    PENDING(0, "待审核"),
    APPROVED(1, "已通过"),
    REJECTED(-1, "已驳回"),
    HIDDEN(2, "已隐藏");

    private final int value;
    private final String label;

    ReviewStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public static ReviewStatus of(int value) {
        for (ReviewStatus s : values()) {
            if (s.value == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知评价状态: " + value);
    }
}
