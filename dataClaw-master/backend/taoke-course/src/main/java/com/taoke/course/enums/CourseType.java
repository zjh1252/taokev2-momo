package com.taoke.course.enums;

import lombok.Getter;

/**
 * 课程类型枚举
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Getter
public enum CourseType {

    INTERNAL("内训课"),
    OPEN_OFFLINE("线下公开课"),
    OPEN_ONLINE("线上公开课");

    private final String label;

    CourseType(String label) {
        this.label = label;
    }

    /**
     * 是否为公开课类型（线上或线下）
     */
    public boolean isOpen() {
        return this == OPEN_OFFLINE || this == OPEN_ONLINE;
    }
}
