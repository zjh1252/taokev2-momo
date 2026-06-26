package com.taoke.common.security;

/**
 * 用户身份接口 — 在 taoke-common 层定义，供各模块获取当前登录用户 ID。
 * <p>
 * 由 {@code SecurityUser}（taoke-user 模块）实现，
 * {@link SecurityUtils} 通过此接口从 SecurityContext 中提取用户信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
public interface UserPrincipal {

    Integer getUserId();
}
