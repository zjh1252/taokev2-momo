package com.taoke.common.search;

import com.taoke.common.response.ApiResponse;
import co.elastic.clients.elasticsearch.ElasticsearchClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminSearchControllerTest {

    @Test
    void overviewReturnsDefaultIndexIndexDetailsAndDocTypes() {
        SearchIndexService searchIndexService = mock(SearchIndexService.class);
        SearchSyncScheduler syncScheduler = mock(SearchSyncScheduler.class);
        DocumentSyncProvider courseProvider = mock(DocumentSyncProvider.class);
        DocumentSyncProvider trainerProvider = mock(DocumentSyncProvider.class);

        when(searchIndexService.getDefaultIndexName()).thenReturn("taokev2app");
        when(searchIndexService.listIndexInfos()).thenReturn(List.of(
                new SearchIndexInfo("taokev2_20260710", false, 12L),
                new SearchIndexInfo("taokev2app", true, 30L)
        ));
        when(courseProvider.getDocType()).thenReturn("course");
        when(trainerProvider.getDocType()).thenReturn("trainer");
        when(syncScheduler.getProviders()).thenReturn(List.of(courseProvider, trainerProvider));

        AdminSearchController controller = new AdminSearchController(searchIndexService, syncScheduler);

        ApiResponse<SearchManagementOverview> response = controller.overview();

        assertThat(response.getData().getDefaultIndex()).isEqualTo("taokev2app");
        assertThat(response.getData().getIndices())
                .extracting(SearchIndexInfo::getName)
                .containsExactly("taokev2_20260710", "taokev2app");
        assertThat(response.getData().getIndices())
                .extracting(SearchIndexInfo::getDocumentCount)
                .containsExactly(12L, 30L);
        assertThat(response.getData().getDocTypes()).containsExactly("course", "trainer");
    }

    @Test
    void reindexByTypeReturnsTargetIndexAndAsyncAccepted() {
        SearchIndexService searchIndexService = mock(SearchIndexService.class);
        SearchSyncScheduler syncScheduler = mock(SearchSyncScheduler.class);
        DocumentSyncProvider courseProvider = mock(DocumentSyncProvider.class);
        AdminSearchController.ReindexRequest request = new AdminSearchController.ReindexRequest();
        request.setTargetIndex("taokev2_shadow");

        when(searchIndexService.getDefaultIndexName()).thenReturn("taokev2app");
        when(courseProvider.getDocType()).thenReturn("course");
        when(syncScheduler.getProvider("course")).thenReturn(courseProvider);

        AdminSearchController controller = new AdminSearchController(searchIndexService, syncScheduler);

        ApiResponse<AdminSearchController.ReindexResult> response = controller.reindexByType("course", request);

        assertThat(response.getData().getTargetIndex()).isEqualTo("taokev2_shadow");
        assertThat(response.getData().getIndexedCounts()).containsEntry("course", -1L);
        assertThat(response.getData().getDocTypes()).containsExactly("course");
        assertThat(response.getData().getMessage()).contains("后台启动");
    }

    @Test
    void createIndexRejectsNamesOutsideManagedPrefixBeforeCallingElasticsearch() {
        ElasticsearchClient esClient = mock(ElasticsearchClient.class);
        ElasticsearchProperties properties = new ElasticsearchProperties();
        properties.setIndexName("taokev2app");
        SearchIndexService searchIndexService = new SearchIndexService(
                esClient,
                properties,
                new ObjectMapper()
        );

        assertThatThrownBy(() -> searchIndexService.createIndex("test"))
                .isInstanceOf(SearchException.class)
                .satisfies(error -> assertThat(((SearchException) error).getErrorCode())
                        .isEqualTo(ErrorCode.PARAM_INVALID))
                .hasMessageContaining("taokev2");
    }
}
