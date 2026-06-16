package com.taoke.course.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 运营素材适用场景
 *
 * @author Fangxinxin
 * @date 2026-06-15 10:00
 */
@Getter
@RequiredArgsConstructor
public enum OpsMaterialScene {

    GENERAL("通用"),
    OPEN("公开课"),
    INTERNAL("内训课"),
    VIDEO("录播课"),
    TRAINER("专家头像"),
    INSTITUTION("机构头像");

    private final String label;

    public static OpsMaterialScene fromCode(String code) {
        if (code == null || code.isBlank()) {
            return GENERAL;
        }
        return OpsMaterialScene.valueOf(code.trim().toUpperCase());
    }
}
