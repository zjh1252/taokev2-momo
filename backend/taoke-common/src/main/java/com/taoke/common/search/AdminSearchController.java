package com.taoke.common.search;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 后台搜索索引管理 — 索引创建/删除、全量重建。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Slf4j
@Tag(name = "搜索索引管理", description = "后台管理：索引管理与全量重建")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminSearchController {

    private final SearchIndexService searchIndexService;
    private final SearchSyncScheduler syncScheduler;

    // ==================== 索引管理 ====================

    @Operation(summary = "列出所有搜索索引")
    @GetMapping("/admin/search/indices")
    public ApiResponse<Set<String>> listIndices() {
        return ApiResponse.ok(searchIndexService.listIndices());
    }

    @Operation(summary = "后台全文搜索管理概览")
    @GetMapping("/admin/search/overview")
    public ApiResponse<SearchManagementOverview> overview() {
        List<String> docTypes = syncScheduler.getProviders().stream()
                .map(DocumentSyncProvider::getDocType)
                .toList();
        return ApiResponse.ok(new SearchManagementOverview(
                searchIndexService.getDefaultIndexName(),
                searchIndexService.listIndexInfos(),
                docTypes
        ));
    }

    @Operation(summary = "创建索引")
    @PostMapping("/admin/search/indices")
    public ApiResponse<Boolean> createIndex(@RequestBody(required = false) IndexRequest request) {
        String indexName = (request != null && request.getIndexName() != null && !request.getIndexName().isBlank())
                ? request.getIndexName()
                : searchIndexService.getDefaultIndexName();
        boolean created = searchIndexService.createIndex(indexName);
        return ApiResponse.ok(created);
    }

    @Operation(summary = "更新索引 mapping（用于加新字段）")
    @PutMapping("/admin/search/indices/{indexName}/mapping")
    public ApiResponse<Boolean> putMapping(
            @Parameter(description = "索引名称") @PathVariable String indexName) {
        return ApiResponse.ok(searchIndexService.putMapping(indexName));
    }

    @Operation(summary = "删除索引（禁止删除默认索引）")
    @DeleteMapping("/admin/search/indices/{indexName}")
    public ApiResponse<Void> deleteIndex(
            @Parameter(description = "索引名称") @PathVariable String indexName) {
        searchIndexService.deleteIndex(indexName);
        return ApiResponse.ok();
    }

    // ==================== 全量重建 ====================

    @Operation(summary = "全量重建所有文档类型（后台异步执行，避免 nginx/网关超时）")
    @PostMapping("/admin/search/reindex")
    public ApiResponse<ReindexResult> reindexAll(@RequestBody(required = false) ReindexRequest request) {
        String targetIndex = resolveTargetIndex(request);
        List<DocumentSyncProvider> providers = List.copyOf(syncScheduler.getProviders());
        List<String> docTypes = providers.stream().map(DocumentSyncProvider::getDocType).toList();

        Thread.startVirtualThread(() -> {
            try {
                for (DocumentSyncProvider provider : providers) {
                    syncScheduler.fullReindex(provider, targetIndex);
                }
                log.info("异步全量重建完成: targetIndex={}, docTypes={}", targetIndex, docTypes);
            } catch (Exception e) {
                log.error("异步全量重建失败: targetIndex={}", targetIndex, e);
            }
        });

        Map<String, Long> indexedCounts = new LinkedHashMap<>();
        docTypes.forEach(t -> indexedCounts.put(t, -1L));
        return ApiResponse.ok(new ReindexResult(docTypes, "重建任务已在后台启动，请稍后刷新索引文档数查看结果",
                targetIndex, indexedCounts));
    }

    @Operation(summary = "按文档类型全量重建（后台异步执行，避免 nginx/网关超时）")
    @PostMapping("/admin/search/reindex/{docType}")
    public ApiResponse<ReindexResult> reindexByType(
            @Parameter(description = "文档类型：course / trainer") @PathVariable String docType,
            @RequestBody(required = false) ReindexRequest request) {

        DocumentSyncProvider provider = syncScheduler.getProvider(docType);
        if (provider == null) {
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "未找到文档类型: " + docType);
        }

        String targetIndex = resolveTargetIndex(request);
        Thread.startVirtualThread(() -> {
            try {
                long count = syncScheduler.fullReindex(provider, targetIndex);
                log.info("异步重建完成: docType={}, count={}, targetIndex={}", docType, count, targetIndex);
            } catch (Exception e) {
                log.error("异步重建失败: docType={}, targetIndex={}", docType, targetIndex, e);
            }
        });

        return ApiResponse.ok(new ReindexResult(
                List.of(docType),
                "重建任务已在后台启动，请稍后刷新索引文档数查看结果",
                targetIndex,
                Map.of(docType, -1L)
        ));
    }

    private String resolveTargetIndex(ReindexRequest request) {
        if (request != null && request.getTargetIndex() != null && !request.getTargetIndex().isBlank()) {
            return request.getTargetIndex();
        }
        return searchIndexService.getDefaultIndexName();
    }

    // ==================== 请求/响应 DTO ====================

    @Data
    public static class IndexRequest {
        private String indexName;
    }

    @Data
    public static class ReindexRequest {
        /** 目标索引名，不传则使用默认索引 */
        private String targetIndex;
    }

    @Data
    public static class ReindexResult {
        private final List<String> docTypes;
        private final String message;
        private final String targetIndex;
        private final Map<String, Long> indexedCounts;
    }
}
