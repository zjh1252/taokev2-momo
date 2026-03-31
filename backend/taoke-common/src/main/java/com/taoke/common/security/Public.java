package com.taoke.common.security;

import java.lang.annotation.*;

/**
 * 标记为公开接口，无需登录即可访问
 * <p>
 * 用于 Controller 方法上，表示该接口跳过 JWT 认证和权限校验。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Public {
}
