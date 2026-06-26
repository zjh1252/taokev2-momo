package com.taoke.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 角色分类枚举 — 对应 sys_roles.role_type 字段
 *
 * @author Fangxinxin
 * @date 2026-04-02 11:00
 */
@Getter
@AllArgsConstructor
public enum RoleType {

    PLATFORM("运营管理角色"),
    BUSINESS("业务角色");

    private final String label;
}
