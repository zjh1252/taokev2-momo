package com.taoke.common.search;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch.core.search.TotalHitsRelation;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.response.PageResponse;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 搜索结果补全测试。
 *
 * @author Fangxinxin
 * @date 2026-08-05 20:00
 */
class SearchIndexServiceTest {

    @Test
    void searchAppliesResultEnrichersBeforeReturningHits() throws Exception {
        ElasticsearchClient esClient = mock(ElasticsearchClient.class);
        ElasticsearchProperties properties = new ElasticsearchProperties();
        properties.setIndexName("taokev2app");

        Map<String, Object> source = new HashMap<>();
        source.put("docId", "course_83646");
        source.put("docType", "course");
        source.put("id", 83646);
        source.put("title", "非人力资源经理的人力资源管理");

        stubSearch(esClient, searchResponse(source));

        SearchResultEnricher enricher = rows -> rows.forEach(row -> {
            if ("course".equals(row.get("docType")) && Integer.valueOf(83646).equals(row.get("id"))) {
                row.put("trainerName", "徐老师");
            }
        });
        SearchIndexService service = new SearchIndexService(
                esClient,
                properties,
                new ObjectMapper(),
                List.of(enricher)
        );

        SearchRequest request = new SearchRequest();
        request.setDocType("course");

        PageResponse<Map<String, Object>> page = service.search(request);

        assertThat(page.getList()).singleElement()
                .extracting(row -> row.get("trainerName"))
                .isEqualTo("徐老师");
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static void stubSearch(ElasticsearchClient esClient, SearchResponse<Map> response) throws Exception {
        when(esClient.search((Function) any(Function.class), eq(Map.class)))
                .thenReturn((SearchResponse) response);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static SearchResponse<Map> searchResponse(Map<String, Object> source) {
        return SearchResponse.of(r -> r
                .took(1)
                .timedOut(false)
                .shards(s -> s.total(1).successful(1).failed(0))
                .hits(h -> h
                        .total(t -> t.value(1).relation(TotalHitsRelation.Eq))
                        .hits(Hit.of(hit -> hit
                                .index("taokev2app")
                                .id("course_83646")
                                .source((Map) source)
                        ))
                )
        );
    }
}
