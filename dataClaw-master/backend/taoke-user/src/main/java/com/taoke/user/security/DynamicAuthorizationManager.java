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
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import org.springframework.context.annotation.Lazy;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
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

    /**
     * 缓存 "HTTP方法 + URI" → HandlerMethod 的映射，避免每次请求都遍历全量映射表。
     * 用 Optional 包装以区分"查过但没命中"和"还没查过"。
     */
    private final ConcurrentHashMap<String, Optional<HandlerMethod>> handlerMethodCache = new ConcurrentHashMap<>(256);

    public DynamicAuthorizationManager(@Lazy RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authenticationSupplier,
                                       RequestAuthorizationContext context) {
        HttpServletRequest request = context.getRequest();

        HandlerMethod handlerMethod = resolveHandlerMethod(request);
        if (handlerMethod == null) {
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

    /**
     * 通过遍历已注册的 RequestMappingInfo 来匹配 HandlerMethod，
     * 避免调用 handlerMapping.getHandler() 触发 Security 过滤器链导致无限递归。
     * 结果按 "HTTP方法 + URI" 缓存，同一路径只解析一次。
     */
    private HandlerMethod resolveHandlerMethod(HttpServletRequest request) {
        String cacheKey = request.getMethod() + " " + request.getRequestURI();
        Optional<HandlerMethod> cached = handlerMethodCache.get(cacheKey);
        if (cached != null) {
            return cached.orElse(null);
        }

        HandlerMethod matched = null;
        try {
            Map<RequestMappingInfo, HandlerMethod> methods = handlerMapping.getHandlerMethods();
            for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : methods.entrySet()) {
                if (entry.getKey().getMatchingCondition(request) != null) {
                    matched = entry.getValue();
                    break;
                }
            }
        } catch (Exception e) {
            log.debug("解析 HandlerMethod 失败: {}", e.getMessage());
        }

        handlerMethodCache.put(cacheKey, Optional.ofNullable(matched));
        return matched;
    }
}
