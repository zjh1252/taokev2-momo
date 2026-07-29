package com.taoke.course.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.course.dto.course.PublicCourseQuery;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class PublicCourseListCacheTest {

    @Mock
    StringRedisTemplate stringRedisTemplate;

    @Mock
    ObjectMapper objectMapper;

    @InjectMocks
    PublicCourseListCache cache;

    private PublicCourseQuery cityUpcoming(int cityId) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setIsOpen(true);
        q.setPage(1);
        q.setSize(10);
        q.setSortBy("time");
        q.setCityIds(List.of(cityId));
        q.setEnrollStatus("ENROLLING");
        return q;
    }

    @Test
    void isCacheable_singleCityEnrollingSize10() {
        assertTrue(cache.isCacheableDefault(cityUpcoming(2)));
    }

    @Test
    void isCacheable_rejectsMultiCity() {
        PublicCourseQuery q = cityUpcoming(2);
        q.setCityIds(List.of(2, 3));
        assertFalse(cache.isCacheableDefault(q));
    }

    @Test
    void listKey_differsByCity() throws Exception {
        String shanghaiKey = invokeListKey(cityUpcoming(2));
        String beijingKey = invokeListKey(cityUpcoming(1));
        assertNotEquals(shanghaiKey, beijingKey);
        assertTrue(shanghaiKey.contains(":c2:"));
        assertTrue(beijingKey.contains(":c1:"));
        assertTrue(shanghaiKey.contains(":eENROLLING"));
        assertTrue(beijingKey.contains(":eENROLLING"));
    }

    private String invokeListKey(PublicCourseQuery query) throws Exception {
        Method method = PublicCourseListCache.class.getDeclaredMethod("listKey", PublicCourseQuery.class);
        method.setAccessible(true);
        return (String) method.invoke(null, query);
    }
}
