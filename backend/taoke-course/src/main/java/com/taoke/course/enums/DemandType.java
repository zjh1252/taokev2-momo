package com.taoke.course.enums;

import lombok.Getter;

/**
 * 需求类型枚举
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
public enum DemandType {

    DEFAULT("首页发布"),
    TRAINING("企业培训需求"),
    CASE_CUSTOM("案例定制"),
    INTERNAL_RESERVATION("内训课预约");

    private final String label;

    DemandType(String label) {
        this.label = label;
    }
}
