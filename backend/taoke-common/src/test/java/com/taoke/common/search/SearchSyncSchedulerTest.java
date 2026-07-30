package com.taoke.common.search;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 全量重建分页写入测试。
 *
 * @author Fangxinxin
 * @date 2026-07-30 15:55
 */
class SearchSyncSchedulerTest {

    @Test
    void fullReindexPagesThroughProviderAndBulkIndexesEachBatch() {
        SearchIndexService indexService = mock(SearchIndexService.class);
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(valueOps);

        ElasticsearchProperties properties = new ElasticsearchProperties();
        properties.setIndexName("taokev2app");
        properties.setReindexBatchSize(2);

        DocumentSyncProvider provider = new DocumentSyncProvider() {
            @Override
            public String getDocType() {
                return "course";
            }

            @Override
            public List<? extends BaseDocument> fetchUpdatedSince(LocalDateTime since) {
                return List.of();
            }

            @Override
            public List<Integer> fetchRemovedSince(LocalDateTime since) {
                return List.of();
            }

            @Override
            public List<? extends BaseDocument> fetchAll() {
                throw new AssertionError("fullReindex 应走 fetchPage，避免一次加载全量");
            }

            @Override
            public List<? extends BaseDocument> fetchPage(int page, int size) {
                assertThat(size).isEqualTo(2);
                if (page == 0) {
                    return List.of(doc(1), doc(2));
                }
                if (page == 1) {
                    return List.of(doc(3));
                }
                return List.of();
            }
        };

        SearchSyncScheduler scheduler = new SearchSyncScheduler(
                List.of(provider),
                indexService,
                redis,
                properties
        );

        long indexed = scheduler.fullReindex(provider, null);

        assertThat(indexed).isEqualTo(3L);
        verify(indexService, times(2)).bulkIndex(eq("taokev2app"), anyList());
        verify(valueOps).set(eq("search:sync:course"), anyString());
    }

    private static BaseDocument doc(int id) {
        CourseLikeDocument doc = new CourseLikeDocument();
        doc.setDocType("course");
        doc.setId(id);
        doc.buildDocId();
        return doc;
    }

    /** 仅用于测试的轻量文档 */
    private static class CourseLikeDocument extends BaseDocument {
    }
}
