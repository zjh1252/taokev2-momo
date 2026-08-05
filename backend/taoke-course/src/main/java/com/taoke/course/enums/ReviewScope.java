package com.taoke.course.enums;

import lombok.Getter;

/**
 * 评价范围枚举
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Getter
public enum ReviewScope {

    COURSE("课程评价"),
    TRAINER("专家评价"),
    INSTITUTION("机构评价"),
    CASE("案例评价"),
    VIDEO("录播课评价");

    private final String label;

    ReviewScope(String label) {
        this.label = label;
    }
}
