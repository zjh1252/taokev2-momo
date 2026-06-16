package com.taoke.course.enums;

import lombok.Getter;

/**
 * 课程状态枚举
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Getter
public enum CourseStatus {

    DRAFT(0, "草稿"),
    PENDING(1, "待审核"),
    PUBLISHED(2, "已上架"),
    REJECTED(3, "驳回"),
    UNPUBLISHED(4, "已下架");

    private final int value;
    private final String label;

    CourseStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public static CourseStatus of(int value) {
        for (CourseStatus s : values()) {
            if (s.value == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知课程状态: " + value);
    }
}
