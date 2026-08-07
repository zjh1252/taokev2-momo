package com.taoke.common.search;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ElasticsearchException;
import co.elastic.clients.elasticsearch._types.mapping.TypeMapping;
import co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier;
import co.elastic.clients.elasticsearch._types.query_dsl.FunctionBoostMode;
import co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore;
import co.elastic.clients.elasticsearch._types.query_dsl.FunctionScoreMode;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkResponseItem;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    private static final String MANAGED_INDEX_PREFIX = "taokev2";
    private static final String INDEX_NAME_PATTERN = "^[a-z0-9][a-z0-9._-]*$";

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
        validateManagedIndexName(indexName);
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
     * 更新已有索引的 mapping（添加新字段，不影响已有字段）。
     */
    public boolean putMapping(String indexName) {
        validateManagedIndexName(indexName);
        try {
            if (!indexExists(indexName)) {
                log.info("索引不存在，跳过 mapping 更新: {}", indexName);
                return false;
            }
            TypeMapping mapping = buildMapping();
            esClient.indices().putMapping(pm -> pm
                    .index(indexName)
                    .properties(mapping.properties())
            );
            log.info("更新索引 mapping: {}", indexName);
            return true;
        } catch (IOException e) {
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "更新索引 mapping 失败: " + indexName, e);
        }
    }

    /**
     * 删除索引（禁止删除默认索引）
     *
     * @param indexName 索引名称
     */
    public void deleteIndex(String indexName) {
        validateManagedIndexName(indexName);
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
        validateManagedIndexName(indexName);
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
        } catch (Exception e) {
            // 无匹配索引时 ES 会返回 index_not_found_exception，也有 IOException
            if (isIndexNotFound(e)) {
                return Set.of();
            }
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "列出索引失败", e);
        }
    }

    /**
     * 列出索引及基础统计信息，供后台管理页展示。
     */
    public List<SearchIndexInfo> listIndexInfos() {
        String defaultIndex = properties.getIndexName();
        return listIndices().stream()
                .sorted()
                .map(name -> new SearchIndexInfo(name, defaultIndex.equals(name), countDocuments(name)))
                .toList();
    }

    /**
     * 统计指定索引中的文档数量。索引不存在时返回 0，避免管理页因空环境不可用。
     */
    public long countDocuments(String indexName) {
        validateManagedIndexName(indexName);
        try {
            return esClient.count(c -> c.index(indexName)).count();
        } catch (Exception e) {
            if (isIndexNotFound(e)) {
                return 0L;
            }
            throw new SearchException(ErrorCode.SEARCH_INDEX_ERROR, "统计索引文档数失败: " + indexName, e);
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

        int batchSize = Math.max(1, properties.getReindexBatchSize());
        for (int from = 0; from < documents.size(); from += batchSize) {
            int to = Math.min(from + batchSize, documents.size());
            bulkIndexChunk(indexName, documents.subList(from, to));
        }
    }

    @SuppressWarnings("unchecked")
    private void bulkIndexChunk(String indexName, List<? extends BaseDocument> documents) {
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
            LocalDateTime effectiveNow = LocalDateTime.now();

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
                                    "trainerName", "categoryName",
                                    "expertiseCategoryNames", "industryCategoryNames",
                                    "provinceName", "cityName")
                    ));
                }

                // docType 过滤
                if (request.getDocType() != null && !request.getDocType().isBlank()) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("docType")
                            .value(request.getDocType())
                    ));
                }

                // 课程搜索：排除到期且开启自动隐藏的线下公开课（按查询日实时判断）
                if ("course".equalsIgnoreCase(request.getDocType())) {
                    String today = LocalDate.now().toString();
                    boolQuery.filter(f -> f.bool(b -> b
                            .should(sh -> sh.bool(inner -> inner.mustNot(mn -> mn.term(t -> t
                                    .field("type")
                                    .value("OPEN_OFFLINE")))))
                            .should(sh -> sh.term(t -> t.field("isExpireHide").value(0)))
                            .should(sh -> sh.bool(inner -> inner.mustNot(mn -> mn.exists(e -> e
                                    .field("courseOpenEndDate")))))
                            .should(sh -> sh.range(r -> r.date(d -> d.field("courseOpenEndDate").gte(today))))
                            .minimumShouldMatch("1")
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

                if (request.getIsFree() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("isFree")
                            .value(request.getIsFree())
                    ));
                }

                if (hasPlanFilter(request)) {
                    boolQuery.filter(f -> f.nested(n -> n
                            .path("plans")
                            .query(q -> q.bool(planQuery -> {
                                if (request.getPlanProvinceId() != null) {
                                    planQuery.filter(pf -> pf.term(t -> t
                                            .field("plans.provinceId")
                                            .value(request.getPlanProvinceId())));
                                }
                                if (request.getPlanCityId() != null) {
                                    planQuery.filter(pf -> pf.term(t -> t
                                            .field("plans.cityId")
                                            .value(request.getPlanCityId())));
                                }
                                // 招生中：场次结束时间 >= 服务器时间（与详情页规则一致）
                                if (isEnrolling(request)) {
                                    planQuery.filter(pf -> pf.range(r -> r.date(d -> d
                                            .field("plans.endTime")
                                            .gte(effectiveNow.toString()))));
                                }
                                // 开课时间窗仍按开始时间筛选（与筛选项语义一致）
                                if (request.getPlanStartFrom() != null
                                        || request.getPlanStartTo() != null) {
                                    planQuery.filter(pf -> pf.range(r -> r.date(d -> {
                                        d.field("plans.startTime");
                                        if (request.getPlanStartFrom() != null) {
                                            d.gte(request.getPlanStartFrom().toString());
                                        }
                                        if (request.getPlanStartTo() != null) {
                                            d.lte(request.getPlanStartTo().toString());
                                        }
                                        return d;
                                    })));
                                }
                                return planQuery;
                            }))));
                }

                if (request.getIndustryCategoryId() != null) {
                    boolQuery.filter(f -> f.term(t -> t
                            .field("industryCategoryIds")
                            .value(request.getIndustryCategoryId())
                    ));
                }

                BoolQuery builtQuery = boolQuery.build();
                if (isSmartRecommendRank(request)) {
                    s.query(q -> q.functionScore(fs -> fs
                            .query(inner -> inner.bool(builtQuery))
                            .functions(buildSmartRankFunctions(request.getDocType()))
                            .scoreMode(FunctionScoreMode.Sum)
                            .boostMode(resolveSmartBoostMode(request))
                    ));
                } else {
                    s.query(q -> q.bool(builtQuery));
                    String sortField = resolveExplicitSortField(request);
                    if (sortField != null) {
                        s.sort(sort -> sort.field(f -> f.field(sortField).order(SortOrder.Desc).missing("_last")));
                        s.sort(sort -> sort.score(sc -> sc.order(SortOrder.Desc)));
                        s.sort(sort -> sort.field(f -> f.field("id").order(SortOrder.Desc).missing("_last")));
                    }
                }

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
                            .fields("expertiseCategoryNames", hf -> hf.numberOfFragments(1).fragmentSize(100))
                            .fields("industryCategoryNames", hf -> hf.numberOfFragments(1).fragmentSize(100))
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

    private boolean isSmartRecommendRank(SearchRequest request) {
        String rankMode = normalizeSearchOption(request.getRankMode());
        String sortBy = normalizeSearchOption(request.getSortBy());
        return "smartcs".equals(rankMode)
                || "smartcs".equals(sortBy)
                || "smartrecommend".equals(sortBy);
    }

    private FunctionBoostMode resolveSmartBoostMode(SearchRequest request) {
        return FunctionBoostMode.Sum;
    }

    private boolean hasPlanFilter(SearchRequest request) {
        return request.getPlanProvinceId() != null
                || request.getPlanCityId() != null
                || request.getPlanStartFrom() != null
                || request.getPlanStartTo() != null
                || isEnrolling(request);
    }

    private boolean isEnrolling(SearchRequest request) {
        return "ENROLLING".equalsIgnoreCase(request.getEnrollStatus());
    }

    private String resolveExplicitSortField(SearchRequest request) {
        String sortBy = normalizeSearchOption(request.getSortBy());
        return switch (sortBy) {
            case "score", "rating", "star" -> "score";
            case "viewcount", "popular", "popularity", "hot" -> "viewCount";
            case "enrollmentcount", "enrollment", "enroll", "sales" -> "enrollmentCount";
            default -> null;
        };
    }

    private String normalizeSearchOption(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase().replace("_", "").replace("-", "");
    }

    private List<FunctionScore> buildSmartRankFunctions(String docType) {
        boolean trainerOnly = "trainer".equalsIgnoreCase(docType);
        boolean courseOnly = "course".equalsIgnoreCase(docType);
        List<FunctionScore> functions = new java.util.ArrayList<>();

        functions.add(fieldValueFactor("score", 3.0, FieldValueFactorModifier.None));
        functions.add(fieldValueFactor("sortOrder", 0.001, FieldValueFactorModifier.None));

        if (trainerOnly) {
            functions.add(fieldValueFactor("viewCount", 0.6, FieldValueFactorModifier.Log1p));
            functions.add(fieldValueFactor("isRecommended", 3.0, FieldValueFactorModifier.None));
            functions.add(fieldValueFactor("isSigned", 2.0, FieldValueFactorModifier.None));
            functions.add(fieldValueFactor("experienceYears", 0.2, FieldValueFactorModifier.Log1p));
            functions.add(fieldValueFactor("teachingYears", 0.2, FieldValueFactorModifier.Log1p));
        } else if (courseOnly) {
            functions.add(fieldValueFactor("viewCount", 0.6, FieldValueFactorModifier.Log1p));
            functions.add(fieldValueFactor("enrollmentCount", 1.0, FieldValueFactorModifier.Log1p));
            functions.add(fieldValueFactor("isFeatured", 3.0, FieldValueFactorModifier.None));
        } else {
            functions.add(fieldValueFactor("viewCount", 0.6, FieldValueFactorModifier.Log1p));
            functions.add(fieldValueFactor("enrollmentCount", 1.0, FieldValueFactorModifier.Log1p));
            functions.add(fieldValueFactor("isFeatured", 3.0, FieldValueFactorModifier.None));
            functions.add(fieldValueFactor("isRecommended", 3.0, FieldValueFactorModifier.None));
            functions.add(fieldValueFactor("isSigned", 2.0, FieldValueFactorModifier.None));
        }

        return functions;
    }

    private FunctionScore fieldValueFactor(String field, double factor, FieldValueFactorModifier modifier) {
        return FunctionScore.of(fn -> fn.fieldValueFactor(fvf -> fvf
                .field(field)
                .factor(factor)
                .modifier(modifier)
                .missing(0.0)
        ));
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

    public void validateManagedIndexName(String indexName) {
        if (indexName == null || indexName.isBlank()) {
            throw new SearchException(ErrorCode.PARAM_INVALID, "索引名称不能为空");
        }
        if (!indexName.matches(INDEX_NAME_PATTERN)) {
            throw new SearchException(ErrorCode.PARAM_INVALID, "索引名称只能包含小写字母、数字、点、下划线和短横线");
        }
        if (!indexName.startsWith(MANAGED_INDEX_PREFIX)) {
            throw new SearchException(ErrorCode.PARAM_INVALID, "索引名称必须以 " + MANAGED_INDEX_PREFIX + " 开头");
        }
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
                .properties("expertiseCategoryNames", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("industryCategoryNames", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("provinceName", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                .properties("cityName", p -> p.text(t -> t.analyzer(ANALYZER_INDEX).searchAnalyzer(ANALYZER_SEARCH)))
                // 课程过滤字段
                .properties("type", p -> p.keyword(k -> k))
                .properties("categoryId", p -> p.integer(i -> i))
                .properties("subCategoryId", p -> p.integer(i -> i))
                .properties("price", p -> p.scaledFloat(sf -> sf.scalingFactor(100.0)))
                .properties("durationDays", p -> p.integer(i -> i))
                .properties("courseOpenEndDate", p -> p.date(d -> d.format("yyyy-MM-dd||strict_date_optional_time||epoch_millis")))
                .properties("isExpireHide", p -> p.integer(i -> i))
                .properties("isFeatured", p -> p.long_(l -> l))
                .properties("isFree", p -> p.long_(l -> l))
                .properties("sortOrder", p -> p.long_(l -> l))
                .properties("viewCount", p -> p.long_(l -> l))
                .properties("enrollmentCount", p -> p.long_(l -> l))
                .properties("score", p -> p.float_(f -> f))
                .properties("plans", p -> p.nested(n -> n
                        .properties("planId", np -> np.integer(i -> i))
                        .properties("provinceId", np -> np.integer(i -> i))
                        .properties("cityId", np -> np.integer(i -> i))
                        .properties("startTime", np -> np.date(d -> d.format("yyyy-MM-dd'T'HH:mm:ss||strict_date_optional_time||epoch_millis")))
                        .properties("endTime", np -> np.date(d -> d.format("yyyy-MM-dd'T'HH:mm:ss||strict_date_optional_time||epoch_millis")))))
                // 专家过滤字段
                .properties("provinceId", p -> p.integer(i -> i))
                .properties("cityId", p -> p.integer(i -> i))
                .properties("experienceYears", p -> p.integer(i -> i))
                .properties("teachingYears", p -> p.integer(i -> i))
                .properties("isSigned", p -> p.long_(l -> l))
                .properties("isRecommended", p -> p.long_(l -> l))
                .properties("expertiseCategoryIds", p -> p.integer(i -> i))
                .properties("industryCategoryIds", p -> p.integer(i -> i))
        );
    }
}
