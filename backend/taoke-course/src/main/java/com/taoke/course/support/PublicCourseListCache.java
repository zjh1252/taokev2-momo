package com.taoke.course.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.PublicCourseQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 公开课程列表 / 分类计数 Redis 缓存。
 * <p>
 * 缓存内训课、公开课默认列表（含首页常用 size/sort），缩短频道与首页 SSR TTFB。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-07-15 17:35
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PublicCourseListCache {

    private static final String LIST_KEY_PREFIX = "taoke:course:public:list:";
    private static final String COUNT_KEY_PREFIX = "taoke:course:public:catcount:";
    private static final Duration LIST_TTL_BASE = Duration.ofMinutes(60);
    private static final Duration COUNT_TTL_BASE = Duration.ofMinutes(60);

    /** 首页/频道常见 size */
    private static final Set<Integer> CACHEABLE_SIZES = Set.of(15, 30, 36);
    /** 可缓存的 sortBy（空串按 default） */
    private static final Set<String> CACHEABLE_SORTS = Set.of(
            "default", "time", "published", "viewCount", "score");

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 无筛选 + 首页/频道默认分页参数时可缓存（内训或公开课）。
     */
    public boolean isCacheableDefault(PublicCourseQuery query) {
        if (query == null || query.getIsOpen() == null) {
            return false;
        }
        if (query.getPage() > 1) {
            return false;
        }
        int size = query.getSize() <= 0 ? 15 : query.getSize();
        if (!CACHEABLE_SIZES.contains(size)) {
            return false;
        }
        String sort = normalizeSort(query.getSortBy());
        if (!CACHEABLE_SORTS.contains(sort)) {
            return false;
        }
        return query.getInstitutionId() == null
                && (query.getCategoryIds() == null || query.getCategoryIds().isEmpty())
                && (query.getSubCategoryIds() == null || query.getSubCategoryIds().isEmpty())
                && (query.getKeyword() == null || query.getKeyword().isBlank())
                && (query.getType() == null || query.getType().isBlank())
                && (query.getProvinceIds() == null || query.getProvinceIds().isEmpty())
                && (query.getCityIds() == null || query.getCityIds().isEmpty())
                && query.getStartTimeFrom() == null
                && query.getStartTimeTo() == null
                && (query.getTimeQuick() == null || query.getTimeQuick().isBlank())
                && (query.getEnrollStatus() == null || query.getEnrollStatus().isBlank())
                && query.getPriceMin() == null
                && query.getPriceMax() == null
                && query.getIsFree() == null
                && query.getMinScore() == null
                && query.getTrainerIndustryCategoryId() == null
                && query.getTrainerProvinceId() == null
                && query.getTrainerCityId() == null
                && query.getTrainerIsTrusted() == null
                && query.getTrainerHasCopyright() == null;
    }

    /** @deprecated 使用 {@link #isCacheableDefault} */
    public boolean isCacheableInternalDefault(PublicCourseQuery query) {
        return isCacheableDefault(query) && Boolean.FALSE.equals(query.getIsOpen());
    }

    public PageResponse<CourseListItemVO> getDefaultList(PublicCourseQuery query) {
        if (!isCacheableDefault(query)) {
            return null;
        }
        String key = listKey(query);
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取课程列表缓存失败 key={}: {}", key, e.getMessage());
            return null;
        }
    }

    public void putDefaultList(PublicCourseQuery query, PageResponse<CourseListItemVO> body) {
        if (body == null || !isCacheableDefault(query)) {
            return;
        }
        String key = listKey(query);
        try {
            stringRedisTemplate.opsForValue().set(
                    key,
                    objectMapper.writeValueAsString(body),
                    jitter(LIST_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入课程列表缓存失败 key={}: {}", key, e.getMessage());
        }
    }

    /** @deprecated 使用 {@link #getDefaultList} */
    public PageResponse<CourseListItemVO> getInternalDefaultList(int page, int size) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setIsOpen(false);
        q.setPage(page);
        q.setSize(size);
        q.setSortBy("default");
        return getDefaultList(q);
    }

    /** @deprecated 使用 {@link #putDefaultList} */
    public void putInternalDefaultList(int page, int size, PageResponse<CourseListItemVO> body) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setIsOpen(false);
        q.setPage(page);
        q.setSize(size);
        q.setSortBy("default");
        putDefaultList(q, body);
    }

    public Map<Integer, Long> getCategoryL1Counts(boolean isOpen) {
        String key = countKey(isOpen);
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("读取课程分类计数缓存失败 key={}: {}", key, e.getMessage());
            return null;
        }
    }

    public void putCategoryL1Counts(boolean isOpen, Map<Integer, Long> counts) {
        if (counts == null) {
            return;
        }
        String key = countKey(isOpen);
        try {
            stringRedisTemplate.opsForValue().set(
                    key,
                    objectMapper.writeValueAsString(counts),
                    jitter(COUNT_TTL_BASE));
        } catch (Exception e) {
            log.warn("写入课程分类计数缓存失败 key={}: {}", key, e.getMessage());
        }
    }

    /** 上架/下架后清除内训+公开默认列表与分类计数 */
    public void evictPublicListCaches() {
        try {
            Set<String> keys = new LinkedHashSet<>();
            for (boolean open : List.of(false, true)) {
                keys.add(countKey(open));
                for (int size : CACHEABLE_SIZES) {
                    for (String sort : CACHEABLE_SORTS) {
                        keys.add(listKey(open, sort, 1, size));
                    }
                }
            }
            // 兼容旧 key
            keys.add(LIST_KEY_PREFIX + "internal:p1:s15");
            stringRedisTemplate.delete(keys);
        } catch (Exception e) {
            log.warn("清除公开课程列表缓存失败: {}", e.getMessage());
        }
    }

    private static String listKey(PublicCourseQuery query) {
        int page = Math.max(1, query.getPage());
        int size = query.getSize() <= 0 ? 15 : query.getSize();
        return listKey(Boolean.TRUE.equals(query.getIsOpen()), normalizeSort(query.getSortBy()), page, size);
    }

    private static String listKey(boolean isOpen, String sort, int page, int size) {
        String channel = isOpen ? "open" : "internal";
        return LIST_KEY_PREFIX + channel + ":" + sort + ":p" + page + ":s" + size;
    }

    private static String countKey(boolean isOpen) {
        return COUNT_KEY_PREFIX + (isOpen ? "open" : "internal");
    }

    private static String normalizeSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "default";
        }
        return sortBy.trim();
    }

    private static Duration jitter(Duration base) {
        int extra = ThreadLocalRandom.current().nextInt(0, 31);
        return base.plusSeconds(extra);
    }
}
