package com.taoke.course.enums;

import lombok.Getter;

/**
 * 专家留言处理状态枚举
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Getter
public enum LeadMessageStatus {

    NEW(0, "新建"),
    DISPATCHED(1, "已分配"),
    DONE(2, "已处理");

    private final int value;
    private final String label;

    LeadMessageStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public static LeadMessageStatus of(int value) {
        for (LeadMessageStatus s : values()) {
            if (s.value == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知留言状态: " + value);
    }
}
