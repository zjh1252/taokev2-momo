package com.taoke.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 平台业务角色枚举，对应 user_roles.role（含业务方与运营方共 11 种）。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
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
    INSTITUTION("机构"),
    INSTITUTION_EMPLOYEE("机构员工"),

    // ── 运营方 ──
    PLATFORM_AUDITOR("平台审核员"),
    PLATFORM_CS("平台客服"),
    SUPER_ADMIN("超级管理员");

    private final String label;

    /**
     * 编译期字符串常量，可用于注解参数（如 {@code @RequireRole(BusinessRole.Code.TRAINER)}）。
     */
    public static final class Code {
        public static final String ENTERPRISE_BUYER = "ENTERPRISE_BUYER";
        public static final String BUYER = "BUYER";
        public static final String TRAINER = "TRAINER";
        public static final String AGENT = "AGENT";
        public static final String ASSISTANT = "ASSISTANT";
        public static final String ENTERPRISE_AGENT = "ENTERPRISE_AGENT";
        public static final String INSTITUTION = "INSTITUTION";
        public static final String INSTITUTION_EMPLOYEE = "INSTITUTION_EMPLOYEE";
        public static final String PLATFORM_AUDITOR = "PLATFORM_AUDITOR";
        public static final String PLATFORM_CS = "PLATFORM_CS";
        public static final String SUPER_ADMIN = "SUPER_ADMIN";

        private Code() {}
    }
}
