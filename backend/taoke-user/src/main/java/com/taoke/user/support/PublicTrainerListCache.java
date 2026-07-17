package com.taoke.user.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.trainer.TrainerListItemResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 专家公开列表 / 擅长领域计数 Redis 缓存。
 *
 * @author Fangxinxin
 * @date 2026-07-15 17:42
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PublicTrainerListCache {

    private static final String LIST_KEY_PREFIX = "taoke:trainer:public:list:";
    private static final String COUNT_KEY = "taoke:trainer:public:expertise:l1";
    private static final Duration LIST_TTL_BASE = Duration.ofSeconds(120);
    private static final Duration COUNT_TTL_BASE = Duration.ofSeconds(300);

    private static final Set<Integer> CACHEABLE_SIZES = Set.of(9, 12, 15, 16, 18, 20);
    private static final Set<String> CACHEABLE_SORTS = Set.of(
            "default", "score", "newly_joined", "");

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public boolean isCacheableDefault(int page, int size,
                                      Integer expertiseCategoryId, Integer industryCategoryId,
                                      Integer provinceId, Integer cityId,
                                      String keyword, String sort, Integer isTrusted) {
        if (page > 1) {
            return false;
        }
        if (!CACHEABLE_SIZES.contains(size <= 0 ? 16 : size)) {
            return false;
        }
        String s = sort == null ? "" : sort.trim();
        if (!CACHEABLE_SORTS.contains(s)) {
            return false;
        }
        return expertiseCategoryId == null
                && industryCategoryId == null
                && provinceId == null
                && cityId == null
                && (keyword == null || keyword.isBlank())
                && (isTrusted == null || isTrusted == 0);
    }

    public PageResponse<TrainerListItemResponse> getDefaultList(
            String sort, int page, int size, boolean includeCourse) {
        String key = listKey(normalizeSort(sort), page, size, includeCourse);
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取专家列表缓存失败 key={}: {}", key, e.getMessage());
            return null;
        }
    }

    public void putDefaultList(String sort, int page, int size, boolean includeCourse,
                               PageResponse<TrainerListItemResponse> body) {
        if (body == null) {
            return;
        }
        String key = listKey(normalizeSort(sort), page, size, includeCourse);
        try {
            stringRedisTemplate.opsForValue().set(
                    key, objectMapper.writeValueAsString(body), jitter(LIST_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入专家列表缓存失败 key={}: {}", key, e.getMessage());
        }
    }

    public Map<Integer, Long> getExpertiseL1Counts() {
        try {
            String json = stringRedisTemplate.opsForValue().get(COUNT_KEY);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取专家分类计数缓存失败: {}", e.getMessage());
            return null;
        }
    }

    public void putExpertiseL1Counts(Map<Integer, Long> counts) {
        if (counts == null) {
            return;
        }
        try {
            stringRedisTemplate.opsForValue().set(
                    COUNT_KEY, objectMapper.writeValueAsString(counts), jitter(COUNT_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入专家分类计数缓存失败: {}", e.getMessage());
        }
    }

    public void evictPublicListCaches() {
        try {
            Set<String> keys = new LinkedHashSet<>();
            keys.add(COUNT_KEY);
            for (int size : CACHEABLE_SIZES) {
                for (String sort : CACHEABLE_SORTS) {
                    keys.add(listKey(normalizeSort(sort), 1, size, false));
                    keys.add(listKey(normalizeSort(sort), 1, size, true));
                }
            }
            stringRedisTemplate.delete(keys);
        } catch (Exception e) {
            log.warn("清除专家列表缓存失败: {}", e.getMessage());
        }
    }

    private static String listKey(String sort, int page, int size, boolean includeCourse) {
        String s = sort.isEmpty() ? "default" : sort;
        return LIST_KEY_PREFIX + s + ":p" + page + ":s" + size
                + ":c" + (includeCourse ? "1" : "0");
    }

    private static String normalizeSort(String sort) {
        return sort == null ? "" : sort.trim();
    }

    private static Duration jitter(Duration base) {
        return base.plusSeconds(ThreadLocalRandom.current().nextInt(0, 31));
    }
}
