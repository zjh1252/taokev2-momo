package com.taoke.course.enums;

import lombok.Getter;

/**
 * 培训形式枚举
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
public enum DemandFormat {

    ONLINE("线上"),
    OFFLINE("线下"),
    HYBRID("混合");

    private final String label;

    DemandFormat(String label) {
        this.label = label;
    }
}
