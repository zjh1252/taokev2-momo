package com.taoke.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 角色绑定关系状态。
 * <p>统一应用于 5 张绑定表：经纪人↔专家、助理↔专家、机构↔专家、机构↔员工、经纪公司↔专家。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:00
 */
@Getter
@AllArgsConstructor
public enum BindingStatus {

    /** 已生效（专家已确认） */
    ACTIVE(1, "已生效"),
    /** 待确认（发起方已发起，待专家确认） */
    PENDING(2, "待确认"),
    /** 已解绑（双方任意一方解除） */
    UNBOUND(3, "已解绑"),
    /** 已拒绝（专家明确拒绝） */
    REJECTED(4, "已拒绝");

    private final int code;
    private final String label;

    public static BindingStatus fromCode(int code) {
        for (BindingStatus s : values()) {
            if (s.code == code) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知的绑定状态：" + code);
    }
}
