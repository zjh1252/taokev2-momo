package com.taoke.course.enums;

import lombok.Getter;

/**
 * 需求状态枚举
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
public enum DemandStatus {

    SUBMITTED(1, "已提交"),
    PROCESSING(2, "处理中"),
    MATCHED(3, "已匹配"),
    COMPLETED(4, "已完成"),
    CANCELLED(5, "已取消");

    private final int value;
    private final String label;

    DemandStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    /**
     * 是否为终态（已完成、已取消），终态不可回退
     */
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }

    public static DemandStatus of(int value) {
        for (DemandStatus s : values()) {
            if (s.value == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知需求状态: " + value);
    }
}
