package com.taoke.user.enums;

import com.taoke.common.enums.BusinessRole;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 淘课组织类型（与 UC 组织映射）。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Getter
@RequiredArgsConstructor
public enum UcOrgType {

    INSTITUTION(BusinessRole.Code.INSTITUTION),
    ENTERPRISE_AGENT(BusinessRole.Code.ENTERPRISE_AGENT),
    ENTERPRISE_BUYER(BusinessRole.Code.ENTERPRISE_BUYER);

    private final String code;

    public static UcOrgType fromCode(String code) {
        for (UcOrgType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("未知 UC 组织类型: " + code);
    }
}
