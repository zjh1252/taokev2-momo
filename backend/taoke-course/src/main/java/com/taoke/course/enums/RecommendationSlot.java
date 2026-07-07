package com.taoke.course.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 推荐位编码，对应后台推荐管理原型 1_1 ~ 4_1。
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
@Getter
@RequiredArgsConstructor
public enum RecommendationSlot {

    HOME_BANNER("HOME_BANNER", "首页-Banner轮播图", "BANNER"),
    HOME_TRAINER("HOME_TRAINER", "首页-推荐专家", "TRAINER"),
    TRAINER_LIST_TRAINER("TRAINER_LIST_TRAINER", "专家页-推荐专家", "TRAINER"),
    TRAINER_CATEGORY_EXPERT("TRAINER_CATEGORY_EXPERT", "专家页-擅长领域专家", "TRAINER"),
    HOME_INNER_COURSE("HOME_INNER_COURSE", "首页-热门内训课", "COURSE"),
    HOME_OPEN_COURSE("HOME_OPEN_COURSE", "首页-线下公开课", "COURSE"),
    HOME_CASE("HOME_CASE", "首页-专家案例", "CASE"),
    TRAINER_PAGE_CASE("TRAINER_PAGE_CASE", "专家页-推荐案例", "CASE"),
    INSTITUTION_GOLD("INSTITUTION_GOLD", "机构页-金牌机构推荐", "INSTITUTION");

    private final String code;
    private final String label;
    private final String resourceType;

    public static RecommendationSlot fromCode(String code) {
        for (RecommendationSlot slot : values()) {
            if (slot.code.equals(code)) {
                return slot;
            }
        }
        throw new IllegalArgumentException("未知推荐位: " + code);
    }
}
