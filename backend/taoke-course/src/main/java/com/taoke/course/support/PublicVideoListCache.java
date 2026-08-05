package com.taoke.course.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.video.VideoListItemVO;
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
 * 录播课公开列表 / 分类计数 Redis 缓存。
 *
 * @author Fangxinxin
 * @date 2026-07-15 17:40
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PublicVideoListCache {

    private static final String LIST_KEY_PREFIX = "taoke:video:public:list:";
    private static final String COUNT_KEY = "taoke:video:public:catcount:l1";
    private static final Duration LIST_TTL_BASE = Duration.ofMinutes(60);
    private static final Duration COUNT_TTL_BASE = Duration.ofMinutes(60);

    private static final Set<Integer> CACHEABLE_SIZES = Set.of(15, 16, 20, 30);
    private static final Set<String> CACHEABLE_SORTS = Set.of("default", "time", "viewCount", "score");

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public boolean isCacheableDefault(Integer categoryId, Integer subCategoryId, String keyword,
                                      String sortBy, Integer institutionId, Integer isFeatured,
                                      int page, int size, Integer viewerUserId) {
        // 登录态解锁状态因人而异，不缓存
        if (viewerUserId != null && viewerUserId > 0) {
            return false;
        }
        if (page > 1) {
            return false;
        }
        if (!CACHEABLE_SIZES.contains(size <= 0 ? 15 : size)) {
            return false;
        }
        String sort = normalizeSort(sortBy);
        if (!CACHEABLE_SORTS.contains(sort)) {
            return false;
        }
        return categoryId == null
                && subCategoryId == null
                && (keyword == null || keyword.isBlank())
                && institutionId == null
                && (isFeatured == null || isFeatured == 0);
    }

    public PageResponse<VideoListItemVO> getDefaultList(String sortBy, int page, int size) {
        String key = listKey(normalizeSort(sortBy), page, size);
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取录播课列表缓存失败 key={}: {}", key, e.getMessage());
            return null;
        }
    }

    public void putDefaultList(String sortBy, int page, int size, PageResponse<VideoListItemVO> body) {
        if (body == null) {
            return;
        }
        String key = listKey(normalizeSort(sortBy), page, size);
        try {
            stringRedisTemplate.opsForValue().set(
                    key, objectMapper.writeValueAsString(body), jitter(LIST_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入录播课列表缓存失败 key={}: {}", key, e.getMessage());
        }
    }

    public Map<Integer, Long> getCategoryL1Counts() {
        try {
            String json = stringRedisTemplate.opsForValue().get(COUNT_KEY);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取录播课分类计数缓存失败: {}", e.getMessage());
            return null;
        }
    }

    public void putCategoryL1Counts(Map<Integer, Long> counts) {
        if (counts == null) {
            return;
        }
        try {
            stringRedisTemplate.opsForValue().set(
                    COUNT_KEY, objectMapper.writeValueAsString(counts), jitter(COUNT_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入录播课分类计数缓存失败: {}", e.getMessage());
        }
    }

    public void evictPublicListCaches() {
        try {
            Set<String> keys = new LinkedHashSet<>();
            keys.add(COUNT_KEY);
            for (int size : CACHEABLE_SIZES) {
                for (String sort : CACHEABLE_SORTS) {
                    keys.add(listKey(sort, 1, size));
                }
            }
            stringRedisTemplate.delete(keys);
        } catch (Exception e) {
            log.warn("清除录播课列表缓存失败: {}", e.getMessage());
        }
    }

    private static String listKey(String sort, int page, int size) {
        return LIST_KEY_PREFIX + sort + ":p" + page + ":s" + size;
    }

    private static String normalizeSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "default";
        }
        return sortBy.trim();
    }

    private static Duration jitter(Duration base) {
        return base.plusSeconds(ThreadLocalRandom.current().nextInt(0, 31));
    }
}
