package com.taoke.common.search;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch._types.mapping.TypeMapping;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkResponseItem;
import co.elastic.clients.elasticsearch._types.FieldValue;
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
     * 全文搜索（支持高级筛选）
     *
     * @param request 搜索请求参数
     * @return 分页结果
     */
    public PageResponse<Map<String, Object>> search(SearchRequest request) {
        try {
            int page = request.getPage() != null ? request.getPage() : 1;
            int size = request.getSize() != null ? request.getSize() : 20;
            int from = (page - 1) * size;

            @SuppressWarnings("rawtypes")
            SearchResponse<Map> response = esClient.search(s -> {
                s.index(properties.getIndexName())
                        .from(from)
                        .size(size);

                BoolQuery.Builder boolQuery = new BoolQuery.Builder();

                // 关键词全文匹配
                String keyword = request.getKeyword();
                if (keyword != null && !keyword.isBlank()) {
                    boolQuery.must(m -> m.multiMatch(mm -> mm
                            .query(keyword)
                            .fields("title^3", "name^3", "keywords^2",
                                    "intro", "bio", "highlights",
                                    "audience", "goodAt", "expertiseTags",
                                    "trainerName", "categoryName")
                    ));
                }

                // docType 过滤
                if (request.getDocType() != null && !request.getDocType().isBlank()) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("docType")
                            .value(request.getDocType())
                    ));
                }

                // 课程子类型过滤（支持多选，如公开课 = OPEN_OFFLINE + OPEN_ONLINE）
                if (request.getCourseType() != null && !request.getCourseType().isEmpty()) {
                    List<FieldValue> values = request.getCourseType().stream()
                            .map(FieldValue::of)
                            .toList();
                    boolQuery.filter(f -> f.terms(t -> t
                            .field("type")
                            .terms(tv -> tv.value(values))
                    ));
                }

                // 课程分类 ID
                if (request.getCategoryId() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("categoryId")
                            .value(request.getCategoryId())
                    ));
                }

                // 课程子分类 ID
                if (request.getSubCategoryId() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("subCategoryId")
                            .value(request.getSubCategoryId())
                    ));
                }

                // 价格区间
                if (request.getMinPrice() != null || request.getMaxPrice() != null) {
                    boolQuery.filter(f -> f.range(r -> r.number(n -> {
                        n.field("price");
                        if (request.getMinPrice() != null) {
                            n.gte(request.getMinPrice().doubleValue());
                        }
                        if (request.getMaxPrice() != null) {
                            n.lte(request.getMaxPrice().doubleValue());
                        }
                        return n;
                    })));
                }

                // 授课天数
                if (request.getDurationDays() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("durationDays")
                            .value(request.getDurationDays())
                    ));
                }

                // 省份 ID
                if (request.getProvinceId() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("provinceId")
                            .value(request.getProvinceId())
                    ));
                }

                // 城市 ID
                if (request.getCityId() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("cityId")
                            .value(request.getCityId())
                    ));
                }

                // 最低教学年限
                if (request.getMinExperienceYears() != null) {
                    boolQuery.filter(f -> f.range(r -> r.number(n -> n
                            .field("experienceYears")
                            .gte((double) request.getMinExperienceYears())
                    )));
                }

                // 擅长领域分类 ID
                if (request.getExpertiseCategoryId() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("expertiseCategoryIds")
                            .value(request.getExpertiseCategoryId())
                    ));
                }

                s.query(q -> q.bool(boolQuery.build()));

                // 高亮：对主要文本字段加 highlight，标签用 <em>
                if (keyword != null && !keyword.isBlank()) {
                    s.highlight(h -> h
                            .preTags("<em>")
                            .postTags("</em>")
                            .fields("title", hf -> hf.numberOfFragments(1).fragmentSize(120))
                            .fields("name", hf -> hf.numberOfFragments(1).fragmentSize(120))
                            .fields("intro", hf -> hf.numberOfFragments(1).fragmentSize(150))
                            .fields("bio", hf -> hf.numberOfFragments(1).fragmentSize(150))
                            .fields("keywords", hf -> hf.numberOfFragments(1).fragmentSize(100))
                            .fields("expertiseTags", hf -> hf.numberOfFragments(1).fragmentSize(100))
                            .fields("categoryName", hf -> hf.numberOfFragments(1).fragmentSize(80))
                            .fields("trainerName", hf -> hf.numberOfFragments(1).fragmentSize(80))
                    );
                }

                return s;
            }, Map.class);

            long total = response.hits().total() != null ? response.hits().total().value() : 0;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = response.hits().hits().stream()
                    .map(hit -> {
                        Map<String, Object> source = (Map<String, Object>) hit.source();
                        if (source == null) {
                            source = new java.util.HashMap<>();
                        }
                        // 将 highlight 片段合并到 _highlight 字段
                        if (hit.highlight() != null && !hit.highlight().isEmpty()) {
                            Map<String, String> hlMap = new java.util.LinkedHashMap<>();
                            hit.highlight().forEach((field, fragments) -> {
                                if (!fragments.isEmpty()) {
                                    hlMap.put(field, String.join("…", fragments));
                                }
                            });
                            source.put("_highlight", hlMap);
                        }
                        return source;
                    })
                    .collect(Collectors.toList());

            return PageResponse.of(list, total, page, size);
        } catch (Exception e) {
            int page = request.getPage() != null ? request.getPage() : 1;
            int size = request.getSize() != null ? request.getSize() : 20;
            if (isIndexNotFound(e)) {
                log.warn("搜索索引不存在: {}，已尝试创建并返回空结果（请执行全量重建）", properties.getIndexName());
                createIndex(properties.getIndexName());
                return PageResponse.of(List.of(), 0, page, size);
            }
            log.error("ES 搜索失败: keyword={}, docType={}", request.getKeyword(), request.getDocType(), e);
            throw new SearchException(ErrorCode.SEARCH_EXECUTE_ERROR, "搜索失败", e);
        }
    }

    private boolean isIndexNotFound(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof ElasticsearchException ee
                    && ee.response() != null
                    && ee.response().error() != null
                    && "index_not_found_exception".equals(ee.response().error().type())) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取默认索引名
     */
    public String getDefaultIndexName() {
        return properties.getIndexName();
    }

    /** IK 分词器：索引时最细粒度切分，搜索时智能切分 */
    private static final String ANALYZER_INDEX = "ik_max_word";
    private static final String ANALYZER_SEARCH = "ik_smart";

    /**
     * 构建索引 mapping：全文搜索字段使用 IK 中文分词（ik_max_word 索引 / ik_smart 搜索），
     * 其他字段用 keyword/数值等。
     */
    private TypeMapping buildMapping() {
        return TypeMapping.of(m -> m
                .properties("docId", p -> p.keyword(k -> k))
                .properties("docType", p -> p.keyword(k -> k))
                .properties("id", p -> p.integer(i -> i))
                .properties("createdAt", p -> p.date(d -> d.format("yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd HH:mm:ss||epoch_millis")))
                .properties("updatedAt", p -> p.date(d -> d.format("yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd HH:mm:ss||epoch_millis")))
                // 课程 + 专家共用的全文搜索字段（IK 中文分词）
                .properties("title", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("name", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("intro", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("bio", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("keywords", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("highlights", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("audience", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("goodAt", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("expertiseTags", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("teachingStyle", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("trainerName", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("categoryName", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("subCategoryName", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                // 课程过滤字段
                .properties("type", p -> p.keyword(k -> k))
                .properties("categoryId", p -> p.integer(i -> i))
                .properties("subCategoryId", p -> p.integer(i -> i))
                .properties("price", p -> p.scaledFloat(sf -> sf.scalingFactor(100.0)))
                .properties("durationDays", p -> p.integer(i -> i))
                // 专家过滤字段
                .properties("provinceId", p -> p.integer(i -> i))
                .properties("cityId", p -> p.integer(i -> i))
                .properties("experienceYears", p -> p.integer(i -> i))
                .properties("teachingYears", p -> p.integer(i -> i))
                .properties("expertiseCategoryIds", p -> p.integer(i -> i))
        );
    }
}
