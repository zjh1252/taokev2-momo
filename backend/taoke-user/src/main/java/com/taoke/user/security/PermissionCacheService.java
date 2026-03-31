package com.taoke.user.security;

import com.taoke.user.repository.PermissionRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 权限缓存服务 — 使用 Redis 缓存用户的业务角色与 RBAC 权限编码
 * <p>
 * 缓存策略：
 * <ul>
 *   <li>Key 格式: taoke:user:roles:{userId} / taoke:user:perms:{userId}</li>
 *   <li>TTL: 30 分钟</li>
 *   <li>当角色或权限变更时，调用 evict 清除缓存</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionCacheService {

    // Key：taoke:user:roles:{userId}、taoke:user:perms:{userId}；角色或权限变更时须 evict
    private static final String ROLE_KEY_PREFIX = "taoke:user:roles:";
    private static final String PERM_KEY_PREFIX = "taoke:user:perms:";
    private static final long CACHE_TTL_MINUTES = 30;

    private final StringRedisTemplate redisTemplate;
    private final UserRoleRepository userRoleRepository;
    private final PermissionRepository permissionRepository;

    public Set<String> getBusinessRoles(Integer userId) {
        String key = ROLE_KEY_PREFIX + userId;
        Set<String> cached = redisTemplate.opsForSet().members(key);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

        // 缓存未命中，从数据库查询
        Set<String> roles = userRoleRepository.findByUserIdAndStatus(userId, 1)
                .stream()
                .map(ur -> ur.getRole())
                .collect(Collectors.toSet());

        if (!roles.isEmpty()) {
            redisTemplate.opsForSet().add(key, roles.toArray(new String[0]));
            redisTemplate.expire(key, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        }
        return roles;
    }

    public Set<String> getPermissions(Integer userId) {
        String key = PERM_KEY_PREFIX + userId;
        Set<String> cached = redisTemplate.opsForSet().members(key);
        if (cached != null && !cached.isEmpty()) {
            return cached;
        }

        Set<String> perms = permissionRepository.findPermissionCodesByUserId(userId);
        if (!perms.isEmpty()) {
            redisTemplate.opsForSet().add(key, perms.toArray(new String[0]));
            redisTemplate.expire(key, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        }
        return perms;
    }

    public void evict(Integer userId) {
        redisTemplate.delete(ROLE_KEY_PREFIX + userId);
        redisTemplate.delete(PERM_KEY_PREFIX + userId);
        log.info("已清除用户 {} 的角色与权限缓存", userId);
    }

    public void evictBatch(Set<Integer> userIds) {
        userIds.forEach(this::evict);
    }
}
