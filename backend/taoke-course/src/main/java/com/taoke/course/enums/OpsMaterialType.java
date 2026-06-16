package com.taoke.course.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 运营素材类型
 *
 * @author Fangxinxin
 * @date 2026-06-15 10:00
 */
@Getter
@RequiredArgsConstructor
public enum OpsMaterialType {

    COVER("课程封面"),
    AVATAR("头像");

    private final String label;

    public static OpsMaterialType fromCode(String code) {
        if (code == null || code.isBlank()) {
            return COVER;
        }
        return OpsMaterialType.valueOf(code.trim().toUpperCase());
    }
}
