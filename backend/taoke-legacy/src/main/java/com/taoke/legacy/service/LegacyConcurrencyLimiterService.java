package com.taoke.legacy.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.UUID;

/**
 * 培训宝 legacy 播放并发控制（对齐老站 ConcurrencyLimiter + getData video_orders/concurrencyLimiter）。
 */
@Service
@RequiredArgsConstructor
public class LegacyConcurrencyLimiterService {

    private static final Duration SLOT_TTL = Duration.ofSeconds(15);
    private static final String KEY_PREFIX = "legacy:vco:";

    private final StringRedisTemplate redisTemplate;

    public String acquireSlot(String resourceId, int limit) {
        if (!StringUtils.hasText(resourceId) || limit <= 0) {
            return UUID.randomUUID().toString().replace("-", "");
        }
        String key = KEY_PREFIX + resourceId;
        String targetId = UUID.randomUUID().toString().replace("-", "");
        Long size = redisTemplate.opsForSet().size(key);
        if (size != null && size >= limit) {
            return null;
        }
        redisTemplate.opsForSet().add(key, targetId);
        redisTemplate.expire(key, SLOT_TTL);
        return targetId;
    }

    public boolean heartbeat(String resourceId, String targetId) {
        if (!StringUtils.hasText(resourceId) || !StringUtils.hasText(targetId)) {
            return false;
        }
        String key = KEY_PREFIX + resourceId;
        Boolean member = redisTemplate.opsForSet().isMember(key, targetId);
        if (!Boolean.TRUE.equals(member)) {
            return false;
        }
        redisTemplate.expire(key, SLOT_TTL);
        return true;
    }

    public String buildResourceId(int userId, int videoId) {
        return "tk_vco_" + userId + "_" + videoId;
    }
}
