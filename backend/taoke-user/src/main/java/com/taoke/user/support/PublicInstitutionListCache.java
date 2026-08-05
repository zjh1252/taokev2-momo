package com.taoke.user.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
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
 * 机构公开列表 / 擅长领域计数 Redis 缓存。
 *
 * @author Fangxinxin
 * @date 2026-07-28 17:30
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PublicInstitutionListCache {

    private static final String LIST_KEY_PREFIX = "taoke:institution:public:list:";
    private static final String COUNT_KEY_PREFIX = "taoke:institution:public:expertise:l1:";
    private static final Duration LIST_TTL_BASE = Duration.ofMinutes(60);
    private static final Duration COUNT_TTL_BASE = Duration.ofMinutes(60);

    private static final Set<Integer> CACHEABLE_SIZES = Set.of(15, 50);
    private static final Set<String> CACHEABLE_SORTS = Set.of("default", "popularity", "");

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public boolean isCacheableDefault(int page, int size, String keyword, String sort,
                                      Integer expertiseCategoryId, Integer industryCategoryId,
                                      Integer provinceId, Integer cityId) {
        if (page > 1) {
            return false;
        }
        if (!CACHEABLE_SIZES.contains(size <= 0 ? 15 : size)) {
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
                && (keyword == null || keyword.isBlank());
    }

    public PageResponse<InstitutionListItemResponse> getDefaultList(
            Boolean association, String sort, int page, int size) {
        String key = listKey(association, normalizeSort(sort), page, size);
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取机构列表缓存失败 key={}: {}", key, e.getMessage());
            return null;
        }
    }

    public void putDefaultList(Boolean association, String sort, int page, int size,
                               PageResponse<InstitutionListItemResponse> body) {
        if (body == null) {
            return;
        }
        String key = listKey(association, normalizeSort(sort), page, size);
        try {
            stringRedisTemplate.opsForValue().set(
                    key, objectMapper.writeValueAsString(body), jitter(LIST_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入机构列表缓存失败 key={}: {}", key, e.getMessage());
        }
    }

    public Map<Integer, Long> getExpertiseL1Counts(Boolean association) {
        String key = countKey(association);
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取机构分类计数缓存失败 key={}: {}", key, e.getMessage());
            return null;
        }
    }

    public void putExpertiseL1Counts(Boolean association, Map<Integer, Long> counts) {
        if (counts == null) {
            return;
        }
        String key = countKey(association);
        try {
            stringRedisTemplate.opsForValue().set(
                    key, objectMapper.writeValueAsString(counts), jitter(COUNT_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入机构分类计数缓存失败 key={}: {}", key, e.getMessage());
        }
    }

    public void evictPublicListCaches() {
        try {
            Set<String> keys = new LinkedHashSet<>();
            keys.add(countKey(null));
            keys.add(countKey(true));
            keys.add(countKey(false));
            for (Boolean association : new Boolean[]{null, true, false}) {
                for (int size : CACHEABLE_SIZES) {
                    for (String sort : CACHEABLE_SORTS) {
                        keys.add(listKey(association, normalizeSort(sort), 1, size));
                    }
                }
            }
            stringRedisTemplate.delete(keys);
        } catch (Exception e) {
            log.warn("清除机构列表缓存失败: {}", e.getMessage());
        }
    }

    private static String listKey(Boolean association, String sort, int page, int size) {
        String s = sort.isEmpty() ? "default" : sort;
        return LIST_KEY_PREFIX + associationSegment(association) + ":" + s
                + ":p" + page + ":s" + size;
    }

    private static String countKey(Boolean association) {
        return COUNT_KEY_PREFIX + associationSegment(association);
    }

    private static String associationSegment(Boolean association) {
        if (association == null) {
            return "all";
        }
        return association ? "assoc" : "non";
    }

    private static String normalizeSort(String sort) {
        return sort == null ? "" : sort.trim();
    }

    private static Duration jitter(Duration base) {
        return base.plusSeconds(ThreadLocalRandom.current().nextInt(0, 61));
    }
}
