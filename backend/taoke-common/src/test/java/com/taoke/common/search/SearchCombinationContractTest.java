package com.taoke.common.search;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.FunctionBoostMode;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.indices.ElasticsearchIndicesClient;
import co.elastic.clients.elasticsearch.indices.PutMappingRequest;
import co.elastic.clients.elasticsearch.indices.PutMappingResponse;
import co.elastic.clients.transport.endpoints.BooleanResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SearchCombinationContractTest {

    @Test
    void courseMappingDeclaresNestedPlansAndSmartcsKeepsTextScore() throws Exception {
        SearchIndexService service = service(mock(ElasticsearchClient.class));
        Method mappingMethod = SearchIndexService.class.getDeclaredMethod("buildMapping");
        mappingMethod.setAccessible(true);
        var mapping = (co.elastic.clients.elasticsearch._types.mapping.TypeMapping) mappingMethod.invoke(service);

        var plans = mapping.properties().get("plans");
        assertNotNull(plans);
        assertTrue(plans.isNested());
        assertTrue(plans.nested().properties().get("startTime").isDate());
        assertTrue(plans.nested().properties().get("cityId").isInteger());

        Method boostMethod = SearchIndexService.class.getDeclaredMethod("resolveSmartBoostMode", SearchRequest.class);
        boostMethod.setAccessible(true);
        assertEquals(FunctionBoostMode.Sum, boostMethod.invoke(service, new SearchRequest()));
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void putMappingPreservesNestedPropertyType() throws Exception {
        ElasticsearchClient client = mock(ElasticsearchClient.class);
        ElasticsearchIndicesClient indices = mock(ElasticsearchIndicesClient.class);
        when(client.indices()).thenReturn(indices);
        when(indices.exists(any(Function.class))).thenReturn(new BooleanResponse(true));
        AtomicReference<PutMappingRequest> captured = new AtomicReference<>();
        when(indices.putMapping(any(Function.class))).thenAnswer(invocation -> {
            Function<PutMappingRequest.Builder, ?> fn = invocation.getArgument(0);
            Object built = fn.apply(new PutMappingRequest.Builder());
            captured.set(((co.elastic.clients.util.ObjectBuilder<PutMappingRequest>) built).build());
            return PutMappingResponse.of(response -> response.acknowledged(true));
        });

        assertTrue(service(client).putMapping("taokev2app"));

        assertNotNull(captured.get());
        assertTrue(captured.get().properties().get("plans").isNested());
        assertTrue(captured.get().properties().get("plans").nested().properties().get("cityId").isInteger());
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void locationDateAndEnrollmentUseOneNestedPlanQuery() throws Exception {
        ElasticsearchClient client = mock(ElasticsearchClient.class);
        AtomicReference<co.elastic.clients.elasticsearch.core.SearchRequest> captured = new AtomicReference<>();
        SearchResponse<Map> empty = SearchResponse.of(response -> response
                .took(1)
                .timedOut(false)
                .shards(shards -> shards.total(1).successful(1).failed(0))
                .hits(hits -> hits.hits(List.of())));
        when(client.search(any(Function.class), eq(Map.class))).thenAnswer(invocation -> {
            Function<co.elastic.clients.elasticsearch.core.SearchRequest.Builder, ?> fn = invocation.getArgument(0);
            Object built = fn.apply(new co.elastic.clients.elasticsearch.core.SearchRequest.Builder());
            co.elastic.clients.elasticsearch.core.SearchRequest request =
                    ((co.elastic.clients.util.ObjectBuilder<co.elastic.clients.elasticsearch.core.SearchRequest>) built).build();
            captured.set(request);
            return empty;
        });

        SearchRequest request = new SearchRequest();
        request.setDocType("course");
        request.setKeyword("质量管理");
        request.setRankMode("smartcs");
        request.setPlanProvinceId(2);
        request.setPlanCityId(9);
        request.setPlanStartFrom(LocalDateTime.now().plusDays(1));
        request.setPlanStartTo(LocalDateTime.now().plusMonths(1));
        request.setEnrollStatus("ENROLLING");

        service(client).search(request);

        Query root = captured.get().query();
        assertTrue(root.isFunctionScore());
        assertEquals(FunctionBoostMode.Sum, root.functionScore().boostMode());
        Query nested = root.functionScore().query().bool().filter().stream()
                .filter(Query::isNested)
                .findFirst()
                .orElseThrow();
        assertEquals("plans", nested.nested().path());
        List<Query> planFilters = nested.nested().query().bool().filter();
        assertEquals(4, planFilters.size());
        assertTrue(planFilters.stream().anyMatch(query -> query.isTerm()
                && "plans.provinceId".equals(query.term().field())));
        assertTrue(planFilters.stream().anyMatch(query -> query.isTerm()
                && "plans.cityId".equals(query.term().field())));
        assertTrue(planFilters.stream().anyMatch(query -> query.isRange()
                && "plans.endTime".equals(query.range().date().field())));
        assertTrue(planFilters.stream().anyMatch(query -> query.isRange()
                && "plans.startTime".equals(query.range().date().field())));
    }

    private static SearchIndexService service(ElasticsearchClient client) {
        ElasticsearchProperties properties = new ElasticsearchProperties();
        properties.setIndexName("taokev2app");
        return new SearchIndexService(client, properties, new ObjectMapper());
    }
}
