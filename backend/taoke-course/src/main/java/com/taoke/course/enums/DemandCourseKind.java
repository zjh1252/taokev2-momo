package com.taoke.course.enums;

import lombok.Getter;

/**
 * 培训需求课程种类（培训宝发布需求 embed）
 */
@Getter
public enum DemandCourseKind {

    OPEN("公开课"),
    INTERNAL("内训课");

    private final String label;

    DemandCourseKind(String label) {
        this.label = label;
    }
}
