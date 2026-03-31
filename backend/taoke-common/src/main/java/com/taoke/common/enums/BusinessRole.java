package com.taoke.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 平台业务角色枚举 — 对应 user_roles.role 字段。
 * <p>
 * 共 8 个业务角色 + 3 个运营角色 = 11 个角色。
 */
@Getter
@AllArgsConstructor
public enum BusinessRole {

    // ── 需求方（甲方）──
    ENTERPRISE_BUYER("企业培训采购方"),
    BUYER("个人学员"),

    // ── 供给方（丙方）──
    TRAINER("专家"),
    AGENT("专家经纪人"),
    ASSISTANT("专家助理"),
    ENTERPRISE_AGENT("专家经纪公司"),

    // ── 供给方（乙方）──
    ORGANIZATION("机构"),
    ORGANIZATION_EMPLOYEE("机构员工"),

    // ── 运营方 ──
    PLATFORM_AUDITOR("平台审核员"),
    PLATFORM_CS("平台客服"),
    SUPER_ADMIN("超级管理员");

    private final String label;
}
