package com.taoke.course.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.course.dto.cms.PublicRecommendedItemVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * C 端推荐位 Redis 缓存（首页专家/内训/公开课/案例等运营位）。
 *
 * @author Fangxinxin
 * @date 2026-07-15 17:45
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PublicRecommendationCache {

    private static final String KEY_PREFIX = "taoke:cms:public:reco:";
    private static final Duration TTL_BASE = Duration.ofSeconds(90);

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public List<PublicRecommendedItemVO> get(String slotCode, Integer categoryId, int limit, boolean includeBackup) {
        String key = key(slotCode, categoryId, limit, includeBackup);
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取推荐位缓存失败 key={}: {}", key, e.getMessage());
            return null;
        }
    }

    public void put(String slotCode, Integer categoryId, int limit, boolean includeBackup,
                    List<PublicRecommendedItemVO> items) {
        if (items == null) {
            return;
        }
        String key = key(slotCode, categoryId, limit, includeBackup);
        try {
            stringRedisTemplate.opsForValue().set(
                    key,
                    objectMapper.writeValueAsString(items),
                    TTL_BASE.plusSeconds(ThreadLocalRandom.current().nextInt(0, 21)));
        } catch (Exception e) {
            log.warn("写入推荐位缓存失败 key={}: {}", key, e.getMessage());
        }
    }

    /** CMS 改推荐位后按 slot 前缀清理 */
    public void evictSlot(String slotCode) {
        if (slotCode == null || slotCode.isBlank()) {
            return;
        }
        try {
            Set<String> keys = stringRedisTemplate.keys(KEY_PREFIX + slotCode + ":*");
            if (keys != null && !keys.isEmpty()) {
                stringRedisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("清除推荐位缓存失败 slot={}: {}", slotCode, e.getMessage());
        }
    }

    public void evictAllHomeSlots() {
        for (String slot : List.of(
                "HOME_BANNER", "HOME_TRAINER", "HOME_INNER_COURSE", "HOME_OPEN_COURSE", "HOME_CASE",
                "TRAINER_LIST_TRAINER", "TRAINER_CATEGORY_EXPERT", "TRAINER_PAGE_CASE",
                "INSTITUTION_GOLD")) {
            evictSlot(slot);
        }
    }

    private static String key(String slotCode, Integer categoryId, int limit, boolean includeBackup) {
        String cat = categoryId == null ? "none" : String.valueOf(categoryId);
        return KEY_PREFIX + slotCode + ":c" + cat + ":l" + limit + ":b" + (includeBackup ? 1 : 0);
    }
}
