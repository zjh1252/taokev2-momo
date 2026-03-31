package com.taoke.common.security;

import java.lang.annotation.*;

/**
 * RBAC 权限校验注解 — 校验 permissions 表中的权限节点。
 * <p>
 * 用于 Controller 方法上（主要用于管理后台 API），
 * 表示当前用户必须拥有指定的权限编码。
 * <p>
 * 示例：{@code @RequirePermission("trainer:review")} 表示须拥有"审核专家入驻"权限。
 * <p>
 * SUPER_ADMIN 自动放行，无需单独配置权限。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequirePermission {

    /**
     * 所需的权限编码
     */
    String value();
}
