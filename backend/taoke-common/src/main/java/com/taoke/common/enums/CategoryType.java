package com.taoke.common.enums;

import lombok.Getter;

/**
 * 统一分类类型枚举 — 对应 sys_categories.type 字段
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:50
 */
@Getter
public enum CategoryType {

    TRAINER_EXPERTISE("专家培训领域"),
    TRAINER_INDUSTRY("专家擅长行业");

    private final String label;

    CategoryType(String label) {
        this.label = label;
    }
}
