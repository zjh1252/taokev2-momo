package com.taoke.common.security;

import java.lang.annotation.*;

/**
 * 业务角色校验注解 — 校验 user_roles 表中的业务身份。
 * <p>
 * 用于 Controller 方法上，表示当前用户必须拥有指定的业务角色之一（OR 逻辑）。
 * <p>
 * 示例：{@code @RequireRole({"TRAINER", "ASSISTANT"})} 表示当前用户须为专家或专家助理。
 * <p>
 * SUPER_ADMIN 自动放行，无需在此注解中列出。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireRole {

    /**
     * 允许的业务角色编码列表（满足其一即可）
     */
    String[] value();
}
