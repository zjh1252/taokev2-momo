package com.taoke.user.dto.binding;

/**
 * 绑定类型 — 对应 5 张绑定表。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:50
 */
public enum BindingType {
    /** 经纪人 ↔ 专家 */
    AGENT_TRAINER,
    /** 助理 ↔ 专家 */
    ASSISTANT_TRAINER,
    /** 机构 ↔ 专家 */
    INSTITUTION_TRAINER,
    /** 经纪公司 ↔ 专家 */
    ENTERPRISE_AGENT_TRAINER,
    /** 机构 ↔ 员工 */
    INSTITUTION_EMPLOYEE
}
