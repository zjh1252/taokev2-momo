package com.taoke.course.enums;

import lombok.Getter;

/**
 * 互动资源类型枚举（收藏、点赞的 target_type）
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Getter
public enum InteractionTargetType {

    COURSE("课程"),
    TRAINER("专家"),
    INSTITUTION("机构"),
    CASE("案例");

    private final String label;

    InteractionTargetType(String label) {
        this.label = label;
    }
}
