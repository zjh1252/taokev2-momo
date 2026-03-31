package com.taoke.common.security;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import jakarta.annotation.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 安全上下文工具类
 * <p>
 * 从 {@link SecurityContextHolder} 中提取当前登录用户信息，
 * 要求认证主体实现 {@link UserPrincipal} 接口。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * 获取当前登录用户 ID，未登录时返回 null
     */
    @Nullable
    public static Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal.getUserId();
        }
        return null;
    }

    /**
     * 获取当前登录用户 ID，未登录时抛出 UNAUTHORIZED 异常
     */
    public static Integer getRequiredUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ((UserPrincipal) auth.getPrincipal()).getUserId();
    }
}
