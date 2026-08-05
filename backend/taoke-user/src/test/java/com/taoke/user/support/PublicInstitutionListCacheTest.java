package com.taoke.user.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * @author Fangxinxin
 * @date 2026-07-28 17:45
 */
@ExtendWith(MockitoExtension.class)
class PublicInstitutionListCacheTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    private PublicInstitutionListCache cache;

    @BeforeEach
    void setUp() {
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        cache = new PublicInstitutionListCache(stringRedisTemplate, new ObjectMapper());
    }

    @Test
    void isCacheableDefault_onlyUnconditionalFirstPage() {
        assertTrue(cache.isCacheableDefault(1, 15, null, "default", null, null, null, null));
        assertTrue(cache.isCacheableDefault(1, 50, null, "popularity", null, null, null, null));
        assertFalse(cache.isCacheableDefault(2, 15, null, "default", null, null, null, null));
        assertFalse(cache.isCacheableDefault(1, 15, "淘课", "default", null, null, null, null));
        assertFalse(cache.isCacheableDefault(1, 15, null, "default", 12, null, null, null));
        assertFalse(cache.isCacheableDefault(1, 15, null, "newly_joined", null, null, null, null));
    }

    @Test
    void putAndGetExpertiseL1Counts_roundTrip() throws Exception {
        Map<Integer, Long> counts = Map.of(21, 8L, 33, 0L);
        cache.putExpertiseL1Counts(true, counts);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);
        verify(valueOperations).set(keyCaptor.capture(), jsonCaptor.capture(), ttlCaptor.capture());
        assertEquals("taoke:institution:public:expertise:l1:assoc", keyCaptor.getValue());
        assertTrue(ttlCaptor.getValue().toMinutes() >= 60);

        when(valueOperations.get("taoke:institution:public:expertise:l1:assoc"))
                .thenReturn(jsonCaptor.getValue());
        Map<Integer, Long> loaded = cache.getExpertiseL1Counts(true);
        assertNotNull(loaded);
        assertEquals(8L, loaded.get(21));
        assertEquals(0L, loaded.get(33));
    }

    @Test
    void getDefaultList_missReturnsNull() {
        when(valueOperations.get(anyString())).thenReturn(null);
        assertNull(cache.getDefaultList(null, "default", 1, 15));
    }

    @Test
    void putDefaultList_writesExpectedKey() {
        PageResponse<InstitutionListItemResponse> body =
                PageResponse.of(List.of(), 0, 1, 15);
        cache.putDefaultList(null, "default", 1, 15, body);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(keyCaptor.capture(), anyString(), any(Duration.class));
        assertEquals("taoke:institution:public:list:all:default:p1:s15", keyCaptor.getValue());
    }

    @Test
    void evictPublicListCaches_deletesCountAndListKeys() {
        cache.evictPublicListCaches();
        @SuppressWarnings("unchecked")
        ArgumentCaptor<java.util.Collection<String>> keysCaptor =
                ArgumentCaptor.forClass(java.util.Collection.class);
        verify(stringRedisTemplate).delete(keysCaptor.capture());
        assertTrue(keysCaptor.getValue().contains("taoke:institution:public:expertise:l1:all"));
        assertTrue(keysCaptor.getValue().contains("taoke:institution:public:list:assoc:popularity:p1:s50"));
    }
}
