package com.taoke.course.enums;

import lombok.Getter;

/**
 * 录播课状态枚举
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Getter
public enum VideoStatus {

    DRAFT(0, "草稿"),
    PENDING(1, "待审核"),
    PUBLISHED(2, "已上架"),
    REJECTED(3, "驳回"),
    UNPUBLISHED(4, "已下架");

    private final int value;
    private final String label;

    VideoStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public static VideoStatus of(int value) {
        for (VideoStatus s : values()) {
            if (s.value == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知录播课状态: " + value);
    }
}
