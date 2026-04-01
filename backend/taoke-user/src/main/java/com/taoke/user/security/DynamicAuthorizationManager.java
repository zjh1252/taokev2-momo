package com.taoke.user.security;

import com.taoke.common.security.Public;
import com.taoke.common.security.RequirePermission;
import com.taoke.common.security.RequireRole;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import org.springframework.context.annotation.Lazy;

import java.util.function.Supplier;

/**
 * 动态授权管理器 — 基于 @Public / @RequireRole / @RequirePermission 注解进行权限判定
 * <p>
 * 判定优先级：
 * <ol>
 *   <li>@Public → 放行</li>
 *   <li>未认证 → 拒绝</li>
 *   <li>SUPER_ADMIN → 放行</li>
 *   <li>@RequireRole → 校验业务角色</li>
 *   <li>@RequirePermission → 校验 RBAC 权限</li>
 *   <li>已认证但无注解 → 放行（登录即可访问）</li>
 * </ol>
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Slf4j
@Component
public class DynamicAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final RequestMappingHandlerMapping handlerMapping;

    public DynamicAuthorizationManager(@Lazy RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authenticationSupplier,
                                       RequestAuthorizationContext context) {
        // 判定优先级：1.@Public 放行 2.未认证拒绝 3.SUPER_ADMIN 放行 4.@RequireRole 5.@RequirePermission 6.已认证无注解放行
        HttpServletRequest request = context.getRequest();

        HandlerMethod handlerMethod = resolveHandlerMethod(request);
        if (handlerMethod == null) {
            // 无法解析到控制器方法（静态资源等），放行
            return new AuthorizationDecision(true);
        }

        // 1. @Public → 放行
        if (handlerMethod.hasMethodAnnotation(Public.class)) {
            return new AuthorizationDecision(true);
        }

        // 2. 未认证 → 拒绝
        Authentication authentication = authenticationSupplier.get();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof SecurityUser)) {
            return new AuthorizationDecision(false);
        }

        SecurityUser securityUser = (SecurityUser) authentication.getPrincipal();

        // 3. SUPER_ADMIN → 放行
        if (securityUser.isSuperAdmin()) {
            return new AuthorizationDecision(true);
        }

        // 4. @RequireRole → 校验业务角色（满足其一即可），方法级优先，其次类级
        RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
        if (requireRole == null) {
            requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
        }
        if (requireRole != null) {
            for (String role : requireRole.value()) {
                if (securityUser.hasBusinessRole(role)) {
                    return new AuthorizationDecision(true);
                }
            }
            log.warn("用户 {} 缺少业务角色 {}", securityUser.getUserId(), requireRole.value());
            return new AuthorizationDecision(false);
        }

        // 5. @RequirePermission → 校验 RBAC 权限
        RequirePermission requirePermission = handlerMethod.getMethodAnnotation(RequirePermission.class);
        if (requirePermission != null) {
            boolean hasPermission = securityUser.hasPermission(requirePermission.value());
            if (!hasPermission) {
                log.warn("用户 {} 缺少权限 {}", securityUser.getUserId(), requirePermission.value());
            }
            return new AuthorizationDecision(hasPermission);
        }

        // 6. 已认证但无注解 → 放行（登录即可访问）
        return new AuthorizationDecision(true);
    }

    private HandlerMethod resolveHandlerMethod(HttpServletRequest request) {
        try {
            HandlerExecutionChain chain = handlerMapping.getHandler(request);
            if (chain != null && chain.getHandler() instanceof HandlerMethod) {
                return (HandlerMethod) chain.getHandler();
            }
        } catch (Exception e) {
            log.debug("解析 HandlerMethod 失败: {}", e.getMessage());
        }
        return null;
    }
}
