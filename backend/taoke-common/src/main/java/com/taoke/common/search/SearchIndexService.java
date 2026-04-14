package com.taoke.common.search;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.mapping.TypeMapping;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkResponseItem;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch.indices.CreateIndexResponse;
import co.elastic.clients.elasticsearch.indices.GetIndexResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * ES 索引读写服务 — 封装索引管理、文档批量写入/删除、搜索操作。
 * <p>
 * 面向单索引多文档类型模式，通过 {@code docType} 字段区分不同业务实体。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Slf4j
@Service
@ConditionalOnClass(ElasticsearchClient.class)
@RequiredArgsConstructor
public class SearchIndexService {

    private final ElasticsearchClient esClient;
    private final ElasticsearchProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * 创建索引（含 mapping 定义）
     *
     * @param indexName 索引名称
     * @return 是否创建成功（索引已存在时返回 false）
     */
    public boolean createIndex(String indexName) {
        try {
            if (indexExists(indexName)) {
                log.info("索引已存在，跳过创建: {}", indexName);
                return false;
            }

            CreateIndexResponse response = esClient.indices().create(c -> c
                    .index(indexName)
                    .mappings(buildMapping())
            );
            log.info("创建索引: {}, acknowledged={}", indexName, response.acknowledged());
            return response.acknowledged();
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "创建索引失败: " + indexName, e);
        }
    }

    /**
     * 删除索引（禁止删除默认索引）
     *
     * @param indexName 索引名称
     */
    public void deleteIndex(String indexName) {
        if (properties.getIndexName().equals(indexName)) {
            throw new SearchException(ErrorCode.SEARCH_FORBIDDEN, "禁止删除默认索引: " + indexName);
        }
        try {
            esClient.indices().delete(d -> d.index(indexName));
            log.info("删除索引: {}", indexName);
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "删除索引失败: " + indexName, e);
        }
    }

    /**
     * 检查索引是否存在
     */
    public boolean indexExists(String indexName) {
        try {
            return esClient.indices().exists(e -> e.index(indexName)).value();
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "检查索引失败: " + indexName, e);
        }
    }

    /**
     * 列出所有 taokev2 开头的索引
     */
    public Set<String> listIndices() {
        try {
            GetIndexResponse response = esClient.indices().get(g -> g.index("taokev2*"));
            return response.result().keySet();
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "列出索引失败", e);
        }
    }

    /**
     * 批量写入文档到指定索引
     *
     * @param indexName 目标索引
     * @param documents 文档列表
     */
    @SuppressWarnings("unchecked")
    public void bulkIndex(String indexName, List<? extends BaseDocument> documents) {
        if (documents == null || documents.isEmpty()) {
            return;
        }

        try {
            BulkRequest.Builder bulkBuilder = new BulkRequest.Builder();
            for (BaseDocument doc : documents) {
                doc.buildDocId();
                Map<String, Object> jsonMap = objectMapper.convertValue(doc, Map.class);
                bulkBuilder.operations(op -> op
                        .index(idx -> idx
                                .index(indexName)
                                .id(doc.getDocId())
                                .document(jsonMap)
                        )
                );
            }

            BulkResponse response = esClient.bulk(bulkBuilder.build());
            if (response.errors()) {
                for (BulkResponseItem item : response.items()) {
                    if (item.error() != null) {
                        log.error("批量写入失败: id={}, error={}", item.id(), item.error().reason());
                    }
                }
            } else {
                log.debug("批量写入成功: index={}, count={}", indexName, documents.size());
            }
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_DOCUMENT_ERROR, "批量写入文档失败: " + indexName, e);
        }
    }

    /**
     * 批量写入到默认索引
     */
    public void bulkIndex(List<? extends BaseDocument> documents) {
        bulkIndex(properties.getIndexName(), documents);
    }

    /**
     * 批量删除文档
     *
     * @param indexName 目标索引
     * @param docType   文档类型
     * @param ids       业务主键列表
     */
    public void bulkDelete(String indexName, String docType, List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }

        try {
            BulkRequest.Builder bulkBuilder = new BulkRequest.Builder();
            for (Integer id : ids) {
                String docId = docType + "_" + id;
                bulkBuilder.operations(op -> op
                        .delete(del -> del
                                .index(indexName)
                                .id(docId)
                        )
                );
            }

            BulkResponse response = esClient.bulk(bulkBuilder.build());
            if (response.errors()) {
                for (BulkResponseItem item : response.items()) {
                    if (item.error() != null) {
                        log.error("批量删除失败: id={}, error={}", item.id(), item.error().reason());
                    }
                }
            } else {
                log.debug("批量删除成功: index={}, docType={}, count={}", indexName, docType, ids.size());
            }
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_DOCUMENT_ERROR, "批量删除文档失败: " + indexName, e);
        }
    }

    /**
     * 批量删除默认索引中的文档
     */
    public void bulkDelete(String docType, List<Integer> ids) {
        bulkDelete(properties.getIndexName(), docType, ids);
    }

    /**
     * 全文搜索
     *
     * @param keyword 搜索关键词
     * @param docType 文档类型过滤（null 表示搜所有类型）
     * @param page    页码（从 1 开始）
     * @param size    每页条数
     * @return 分页结果
     */
    public PageResponse<Map<String, Object>> search(String keyword, String docType, int page, int size) {
        try {
            int from = (page - 1) * size;

            @SuppressWarnings("rawtypes")
            SearchResponse<Map> response = esClient.search(s -> {
                s.index(properties.getIndexName())
                        .from(from)
                        .size(size);

                BoolQuery.Builder boolQuery = new BoolQuery.Builder();

                if (keyword != null && !keyword.isBlank()) {
                    boolQuery.must(m -> m.multiMatch(mm -> mm
                            .query(keyword)
                            .fields("title^3", "name^3", "keywords^2",
                                    "intro", "bio", "highlights",
                                    "audience", "goodAt", "expertiseTags",
                                    "trainerName", "categoryName")
                    ));
                }

                if (docType != null && !docType.isBlank()) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("docType")
                            .value(docType)
                    ));
                }

                s.query(q -> q.bool(boolQuery.build()));
                return s;
            }, Map.class);

            long total = response.hits().total() != null ? response.hits().total().value() : 0;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = response.hits().hits().stream()
                    .map(hit -> (Map<String, Object>) hit.source())
                    .collect(Collectors.toList());

            return PageResponse.of(list, total, page, size);
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_EXECUTE_ERROR, "搜索失败", e);
        }
    }

    /**
     * 获取默认索引名
     */
    public String getDefaultIndexName() {
        return properties.getIndexName();
    }

    /**
     * 构建索引 mapping：对需要全文搜索的字段使用 text 类型，其他字段用 keyword/数值等
     */
    private TypeMapping buildMapping() {
        return TypeMapping.of(m -> m
                .properties("docId", p -> p.keyword(k -> k))
                .properties("docType", p -> p.keyword(k -> k))
                .properties("id", p -> p.integer(i -> i))
                .properties("createdAt", p -> p.date(d -> d.format("yyyy-MM-dd HH:mm:ss||epoch_millis")))
                .properties("updatedAt", p -> p.date(d -> d.format("yyyy-MM-dd HH:mm:ss||epoch_millis")))
                // 课程 + 专家共用的全文搜索字段
                .properties("title", p -> p.text(t -> t.analyzer("standard")))
                .properties("name", p -> p.text(t -> t.analyzer("standard")))
                .properties("intro", p -> p.text(t -> t.analyzer("standard")))
                .properties("bio", p -> p.text(t -> t.analyzer("standard")))
                .properties("keywords", p -> p.text(t -> t.analyzer("standard")))
                .properties("highlights", p -> p.text(t -> t.analyzer("standard")))
                .properties("audience", p -> p.text(t -> t.analyzer("standard")))
                .properties("goodAt", p -> p.text(t -> t.analyzer("standard")))
                .properties("expertiseTags", p -> p.text(t -> t.analyzer("standard")))
                .properties("teachingStyle", p -> p.text(t -> t.analyzer("standard")))
                .properties("trainerName", p -> p.text(t -> t.analyzer("standard")))
                .properties("categoryName", p -> p.text(t -> t.analyzer("standard")))
                .properties("subCategoryName", p -> p.text(t -> t.analyzer("standard")))
                // keyword / 数值 / 布尔类字段由 ES dynamic mapping 自动处理
        );
    }
}
