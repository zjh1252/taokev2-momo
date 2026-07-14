package com.taoke.admin.service;

import com.taoke.admin.dto.crawl.*;
import com.taoke.admin.entity.CrawlSource;
import com.taoke.admin.entity.CrawledCourse;
import com.taoke.admin.entity.CrawledTrainer;
import com.taoke.admin.entity.CrawlJob;
import com.taoke.admin.repository.CrawlSourceRepository;
import com.taoke.admin.repository.CrawledCourseRepository;
import com.taoke.admin.repository.CrawledTrainerRepository;
import com.taoke.admin.repository.CrawlJobRepository;
import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.dto.PageResult;
import com.taoke.common.dto.RegionVO;
import com.taoke.common.entity.Category;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.RegionService;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CoursePlanDTO;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.SaveCourseRequest;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserService;
import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import com.taoke.user.dto.trainercase.SaveTrainerCaseRequest;
import com.taoke.user.dto.trainer.TrainerRequest;
import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 后台数据爬取管理编排服务。
 * <p>
 * 负责：触发爬取任务、接收回调、去重检查、审核导入。
 * 对 crawled_trainers/crawled_courses 中间表直接操作（属于 admin 模块），
 * 对正式表通过 api 接口操作。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminCrawlService {

    private final CrawlSourceRepository crawlSourceRepository;
    private final CrawledTrainerRepository crawledTrainerRepository;
    private final CrawledCourseRepository crawledCourseRepository;
    private final CrawlJobRepository crawlJobRepository;
    private final CrawlerClientService crawlerClientService;
    private final CourseDuplicateService courseDuplicateService;
    private final TrainerService trainerService;
    private final UserService userService;
    private final RoleApplyService roleApplyService;
    private final CourseService courseService;
    private final TrainerCaseService trainerCaseService;
    private final RegionService regionService;
    private final CategoryService categoryService;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    @Value("${crawler.callback-token:}")
    private String callbackToken;

    // ==================== 数据源 ====================

    /**
     * 获取可用数据源列表（硬编码，后续可扩展为数据库配置）
     */
    public List<CrawlSourceVO> listSources() {
        List<CrawlSourceVO> dbSources = listSourcesFromDatabase();
        if (dbSources != null) {
            return dbSources;
        }
        return defaultCrawlSources();
    }

    private List<CrawlSourceVO> listSourcesFromDatabase() {
        try {
            return jdbcTemplate.query("select * from crawl_sources", rs -> {
                List<CrawlSourceRow> rows = new ArrayList<>();
                Map<String, String> columns = crawlSourceColumns(rs.getMetaData());
                while (rs.next()) {
                    if (!isCrawlSourceVisible(rs, columns)) {
                        continue;
                    }

                    String code = crawlSourceString(rs, columns, "code", "source_code", "source");
                    String name = crawlSourceString(rs, columns, "name", "source_name", "display_name", "title");
                    String url = crawlSourceString(rs, columns, "url", "source_url", "base_url", "domain", "website");
                    String dataType = crawlSourceString(rs, columns, "data_type", "dataType", "source_type", "type");
                    if (!hasText(code) || !hasText(name) || !hasText(url) || !hasText(dataType)) {
                        log.warn("crawl_sources 存在字段不完整的数据源配置，已跳过: code={}, name={}, url={}, dataType={}",
                                code, name, url, dataType);
                        continue;
                    }

                    CrawlSourceVO source = crawlSource(code, name, url, normalizeCrawlDataType(dataType));
                    int sort = crawlSourceInteger(rs, columns, Integer.MAX_VALUE, "sort_order", "sort", "order_no", "id");
                    rows.add(new CrawlSourceRow(source, sort));
                }

                rows.sort(Comparator
                        .comparingInt(CrawlSourceRow::sort)
                        .thenComparing(row -> defaultText(row.source().getDataType()))
                        .thenComparing(row -> defaultText(row.source().getCode())));
                return rows.stream().map(CrawlSourceRow::source).toList();
            });
        } catch (DataAccessException ex) {
            log.warn("查询 crawl_sources 失败，使用默认数据源列表: {}", ex.getMessage());
            return null;
        }
    }

    private List<CrawlSourceVO> defaultCrawlSources() {
        List<CrawlSourceVO> sources = new ArrayList<>();

        sources.add(crawlSource("jiangshibao", "讲师宝", "https://www.jiangshi99.com", "TRAINER"));
        sources.add(crawlSource("jiangshibao", "讲师宝", "https://www.jiangshi99.com", "COURSE"));
        sources.add(crawlSource("lmschina", "企学宝", "https://www.lmschina.net", "TRAINER"));
        sources.add(crawlSource("lmschina", "企学宝", "https://www.lmschina.net", "COURSE"));
        sources.add(crawlSource("huashijingji", "华师经纪", "https://www.huashijingji.com", "TRAINER"));
        sources.add(crawlSource("huashijingji", "华师经纪", "https://www.huashijingji.com", "COURSE"));
        sources.add(crawlSource("nlypx", "哪里有培训网", "https://www.nlypx.com", "TRAINER"));
        sources.add(crawlSource("nlypx", "哪里有培训网", "https://www.nlypx.com", "COURSE"));
        sources.add(crawlSource("zpedu", "中培伟业", "https://www.zpedu.com", "TRAINER"));
        sources.add(crawlSource("zpedu", "中培伟业", "https://www.zpedu.com", "COURSE"));
        sources.add(crawlSource("jiangshitai", "讲师台", "https://www.jiangshitai.com", "TRAINER"));
        sources.add(crawlSource("jiangshitai", "讲师台", "https://www.jiangshitai.com", "COURSE"));

        return sources;
    }

    private CrawlSourceVO crawlSource(String code, String name, String url, String dataType) {
        CrawlSourceVO source = new CrawlSourceVO();
        source.setCode(code);
        source.setName(name);
        source.setUrl(url);
        source.setDataType(dataType);
        source.setStatus("AVAILABLE");
        return source;
    }

    private record CrawlSourceRow(CrawlSourceVO source, int sort) {
    }

    private Map<String, String> crawlSourceColumns(ResultSetMetaData metaData) throws SQLException {
        Map<String, String> columns = new HashMap<>();
        for (int i = 1; i <= metaData.getColumnCount(); i++) {
            String label = metaData.getColumnLabel(i);
            columns.put(normalizeCrawlSourceColumn(label), label);
        }
        return columns;
    }

    private boolean isCrawlSourceVisible(ResultSet rs, Map<String, String> columns) throws SQLException {
        String enabled = crawlSourceString(rs, columns, "enabled", "is_enabled", "enable_flag", "available");
        if (hasText(enabled) && !isTruthyCrawlSourceValue(enabled)) {
            return false;
        }

        String deleted = crawlSourceString(rs, columns, "deleted", "is_deleted", "delete_flag", "del_flag");
        return !hasText(deleted) || !isTruthyCrawlSourceValue(deleted);
    }

    private String crawlSourceString(ResultSet rs, Map<String, String> columns, String... names) throws SQLException {
        for (String name : names) {
            String column = columns.get(normalizeCrawlSourceColumn(name));
            if (column == null) {
                continue;
            }
            String value = rs.getString(column);
            if (hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private int crawlSourceInteger(ResultSet rs, Map<String, String> columns, int defaultValue, String... names) throws SQLException {
        for (String name : names) {
            String column = columns.get(normalizeCrawlSourceColumn(name));
            if (column == null) {
                continue;
            }
            int value = rs.getInt(column);
            if (!rs.wasNull()) {
                return value;
            }
        }
        return defaultValue;
    }

    private String normalizeCrawlDataType(String dataType) {
        String normalized = defaultText(dataType, "").toUpperCase(Locale.ROOT);
        if ("1".equals(normalized) || "TRAINER".equals(normalized) || "TEACHER".equals(normalized)) {
            return "TRAINER";
        }
        if ("2".equals(normalized) || "COURSE".equals(normalized)) {
            return "COURSE";
        }
        return normalized;
    }

    private String normalizeCrawlSourceColumn(String column) {
        return defaultText(column, "").replace("_", "").replace("-", "").toLowerCase(Locale.ROOT);
    }

    private boolean isTruthyCrawlSourceValue(String value) {
        String normalized = defaultText(value, "").toUpperCase(Locale.ROOT);
        return Set.of("1", "TRUE", "Y", "YES", "ENABLE", "ENABLED", "AVAILABLE").contains(normalized);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    /**
     * 新增数据源
     */
    @Transactional
    public CrawlSourceVO createSource(SaveCrawlSourceRequest request) {
        CrawlSource entity = toEntity(request, new CrawlSource());
        crawlSourceRepository.save(entity);
        return toVO(entity);
    }

    /**
     * 更新数据源
     */
    @Transactional
    public CrawlSourceVO updateSource(Integer id, SaveCrawlSourceRequest request) {
        CrawlSource entity = crawlSourceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("数据源不存在"));
        toEntity(request, entity);
        crawlSourceRepository.save(entity);
        return toVO(entity);
    }

    /**
     * 删除数据源（内置种子不可删除）
     */
    @Transactional
    public void deleteSource(Integer id) {
        CrawlSource entity = crawlSourceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("数据源不存在"));
        if (Boolean.TRUE.equals(entity.getBuiltIn())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "内置数据源不可删除");
        }
        crawlSourceRepository.delete(entity);
    }

    private CrawlSource toEntity(SaveCrawlSourceRequest request, CrawlSource entity) {
        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setUrl(request.getUrl());
        entity.setDataType(request.getDataType());
        entity.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        entity.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        entity.setRemark(request.getRemark());
        return entity;
    }

    private CrawlSourceVO toVO(CrawlSource entity) {
        CrawlSourceVO vo = new CrawlSourceVO();
        vo.setId(entity.getId());
        vo.setCode(entity.getCode());
        vo.setName(entity.getName());
        vo.setUrl(entity.getUrl());
        vo.setDataType(entity.getDataType());
        vo.setEnabled(entity.getEnabled());
        vo.setBuiltIn(entity.getBuiltIn());
        vo.setSortOrder(entity.getSortOrder());
        vo.setRemark(entity.getRemark());
        vo.setStatus(Boolean.TRUE.equals(entity.getEnabled()) ? "AVAILABLE" : "DISABLED");
        return vo;
    }

    // ==================== 爬虫任务 ====================

    /**
     * 触发爬取任务
     */
    public CrawlJobVO triggerJob(TriggerCrawlRequest request) {
        // 1. 调用 Python 爬虫服务创建任务
        String crawlerJobId = crawlerClientService.triggerCrawl(
                request.getSource(), request.getDataType(), request.getMaxItems(), request.getStartUrl());

        // 2. 记录任务到数据库
        CrawlJob job = new CrawlJob();
        job.setSource(request.getSource());
        job.setDataType(request.getDataType());
        job.setStatus(1); // 运行中
        job.setCrawlerJobId(crawlerJobId);
        job.setTotalCount(defaultInt(request.getMaxItems()));
        job.setProgressMessage(request.getMaxItems() != null ? "任务已创建，等待爬虫回调" : "任务已创建，正在发现数据");
        job.setStartedAt(LocalDateTime.now());
        job.setTriggeredBy(0); // TODO: 从 SecurityContext 获取当前用户 ID
        crawlJobRepository.save(job);

        return toJobVO(job);
    }

    /**
     * 分页查询爬取任务列表
     */
    public PageResult<CrawlJobVO> listJobs(CrawlJobQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<CrawlJob> page;
        if (query.getSource() != null && query.getDataType() != null) {
            page = crawlJobRepository.findBySourceAndDataType(query.getSource(), query.getDataType(), pageable);
        } else if (query.getStatus() != null) {
            page = crawlJobRepository.findByStatus(query.getStatus(), pageable);
        } else {
            page = crawlJobRepository.findAll(pageable);
        }

        List<CrawlJobVO> voList = page.getContent().stream().map(this::toJobVO).toList();
        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 获取任务详情
     */
    public CrawlJobVO getJob(Integer id) {
        CrawlJob job = crawlJobRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("任务不存在"));
        return toJobVO(job);
    }

    /**
     * 取消爬取任务
     */
    public void cancelJob(Integer id) {
        CrawlJob job = crawlJobRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("任务不存在"));
        if (job.getStatus() != 1) {
            throw new IllegalStateException("只能取消运行中的任务");
        }
        crawlerClientService.cancelCrawl(job.getCrawlerJobId());
        job.setStatus(4); // 已取消
        job.setFinishedAt(LocalDateTime.now());
        crawlJobRepository.save(job);
    }

    // ==================== 爬取专家管理 ====================

    /**
     * 分页查询爬取的专家列表
     */
    public PageResult<CrawledTrainerVO> listCrawledTrainers(CrawledTrainerQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<CrawledTrainer> page;
        if (query.getSource() != null && query.getReviewStatus() != null) {
            page = crawledTrainerRepository.findBySourceAndReviewStatus(query.getSource(), query.getReviewStatus(), pageable);
        } else if (query.getReviewStatus() != null) {
            page = crawledTrainerRepository.findByReviewStatus(query.getReviewStatus(), pageable);
        } else if (query.getSource() != null) {
            page = crawledTrainerRepository.findBySource(query.getSource(), pageable);
        } else {
            page = crawledTrainerRepository.findAll(pageable);
        }

        // 按去重状态过滤（内存过滤，数据量小时可接受）
        List<CrawledTrainer> content = page.getContent();
        if (query.getDedupStatus() != null) {
            content = content.stream()
                    .filter(t -> Objects.equals(t.getDedupStatus(), query.getDedupStatus()))
                    .toList();
        }

        List<CrawledTrainerVO> voList = content.stream().map(this::toTrainerVO).toList();
        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 获取爬取专家详情
     */
    public CrawledTrainerDetailVO getCrawledTrainerDetail(Integer id) {
        CrawledTrainer ct = crawledTrainerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        return toTrainerDetailVO(ct);
    }

    /**
     * 审核通过并导入专家到正式表
     */
    @Transactional
    public Integer importTrainer(Integer crawledId, ImportTrainerRequest edits) {
        CrawledTrainer ct = crawledTrainerRepository.findById(crawledId)
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        if (ct.getReviewStatus() != 0) {
            throw new IllegalStateException("该记录已处理");
        }

        // 合并管理员编辑
        if (edits != null) {
            if (edits.getName() != null) ct.setName(edits.getName());
            if (edits.getTitle() != null) ct.setTitle(edits.getTitle());
            if (edits.getBio() != null) ct.setBio(edits.getBio());
        }

        if (ct.getDedupStatus() != null && ct.getDedupStatus() >= 2
                && (edits == null || !edits.isForceImport())) {
            throw new IllegalStateException("该专家疑似重复，请确认后使用 forceImport 强制导入");
        }

        User user = userService.createCrawlerImportedUser(
                buildCrawlerUsername(ct.getSource(), ct.getSourceTrainerId(), ct.getId()),
                ct.getName(),
                ct.getAvatar()
        );

        TrainerRequest request = new TrainerRequest();
        request.setName(limit(defaultText(ct.getName()), 100));
        request.setTeachingName(limit(defaultText(ct.getTeachingName(), defaultText(ct.getName())), 64));
        request.setAvatar(defaultText(ct.getAvatar(), ""));
        request.setTitle(limit(defaultText(ct.getTitle()), 64));
        request.setGender(ct.getGender() != null ? ct.getGender() : 0);
        request.setBio(defaultText(ct.getBio()));
        request.setOneLineIntro(limit(defaultText(ct.getOneLineIntro(), ct.getBio()), 255));
        request.setIntro(defaultText(ct.getIntro(), ct.getBio()));
        request.setBackground(defaultText(ct.getBackground()));
        request.setPartialClients(defaultText(ct.getPartialClients()));
        request.setGoodAt(defaultText(ct.getGoodAt(), ct.getExpertiseTags()));
        request.setSpecialties(defaultJsonArray(ct.getSpecialties()));
        request.setExpertiseTags(limit(defaultText(ct.getExpertiseTags()), 500));
        request.setTeachingStyle(limit(defaultText(ct.getTeachingStyle()), 500));
        request.setExperienceYears(ct.getExperienceYears() != null ? ct.getExperienceYears() : 0);
        request.setTeachingYears(ct.getTeachingYears() != null ? ct.getTeachingYears() : 0);
        request.setProvinceId(ct.getProvinceId() != null ? ct.getProvinceId() : 0);
        request.setCityId(ct.getCityId() != null ? ct.getCityId() : 0);
        request.setBooks(toTrainerBooks(ct.getBooksJson()));
        request.setAgreementSigned(true);
        request.setAgreementVersion("crawler-import-v1");

        TrainerResponse trainer = trainerService.save(user.getId(), request);
        roleApplyService.apply(user.getId(), BusinessRole.Code.TRAINER);
        roleApplyService.approve(user.getId(), BusinessRole.Code.TRAINER);

        importTrainerCases(user.getId(), ct.getCasesJson());

        // 爬虫审核导入等价于管理员确认入库，直接同步正式专家状态，避免异步事件延迟导致仪表盘统计不更新。
        trainerService.findByIds(List.of(trainer.getId())).stream().findFirst().ifPresent(this::approveImportedTrainer);

        // 更新中间表状态
        ct.setReviewStatus(3); // 已入库
        ct.setReviewedAt(LocalDateTime.now());
        ct.setImportedTrainerId(trainer.getId());
        crawledTrainerRepository.save(ct);

        log.info("导入爬取专家成功: crawledId={}, trainerId={}, name={}", crawledId, trainer.getId(), ct.getName());
        return trainer.getId();
    }

    /**
     * 驳回爬取专家
     */
    public void rejectCrawledTrainer(Integer id, String reason) {
        CrawledTrainer ct = crawledTrainerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        if (ct.getReviewStatus() != 0) {
            throw new IllegalStateException("该记录已处理");
        }
        ct.setReviewStatus(2); // 已驳回
        ct.setReviewRejectReason(reason);
        ct.setReviewedAt(LocalDateTime.now());
        crawledTrainerRepository.save(ct);
    }

    // ==================== 爬取课程管理 ====================

    /**
     * 分页查询爬取的课程列表
     */
    public PageResult<CrawledCourseVO> listCrawledCourses(CrawledCourseQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<CrawledCourse> page;
        if (query.getSource() != null && query.getReviewStatus() != null) {
            page = crawledCourseRepository.findBySourceAndReviewStatus(query.getSource(), query.getReviewStatus(), pageable);
        } else if (query.getReviewStatus() != null) {
            page = crawledCourseRepository.findByReviewStatus(query.getReviewStatus(), pageable);
        } else if (query.getSource() != null) {
            page = crawledCourseRepository.findBySource(query.getSource(), pageable);
        } else {
            page = crawledCourseRepository.findAll(pageable);
        }

        List<CrawledCourse> content = page.getContent();
        if (query.getDedupStatus() != null) {
            content = content.stream()
                    .filter(c -> Objects.equals(c.getDedupStatus(), query.getDedupStatus()))
                    .toList();
        }

        List<CrawledCourseVO> voList = content.stream().map(this::toCourseVO).toList();
        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 获取爬取课程详情
     */
    public CrawledCourseDetailVO getCrawledCourseDetail(Integer id) {
        CrawledCourse cc = crawledCourseRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        return toCourseDetailVO(cc);
    }

    /**
     * 审核通过并导入课程到正式表
     */
    @Transactional
    public Integer importCourse(Integer crawledId, ImportCourseRequest edits) {
        CrawledCourse cc = crawledCourseRepository.findById(crawledId)
                .orElseThrow(() -> new NoSuchElementException("Crawled course not found"));
        if (cc.getReviewStatus() != 0) {
            throw new IllegalStateException(importBlockedMessage(cc.getReviewStatus()));
        }

        applyCourseEdits(cc, edits);
        autoMapCourseCategory(cc);
        normalizeCourseTiming(cc);

        ensureAllowedCourseType(cc.getType());
        String courseType = normalizeCourseType(cc.getType());
        cc.setType(courseType);
        validateCourseBeforeImport(cc);
        CourseDuplicateService.DuplicateCheckResult duplicateResult = courseDuplicateService.checkAndApply(
                cc, CourseDuplicateService.CheckScene.BEFORE_IMPORT);
        if (duplicateResult.blocking() && (edits == null || !edits.isForceImport())) {
            throw new BusinessException(ErrorCode.DUPLICATE_REQUEST, duplicateResult.reason());
        }
        Trainer publisher = resolveCoursePublisher(cc, edits);

        SaveCourseRequest request = new SaveCourseRequest();
        request.setTitle(limit(defaultText(cc.getTitle()), 200));
        request.setType(courseType);
        request.setCategoryId(cc.getCategoryId() != null ? cc.getCategoryId() : 0);
        request.setSubCategoryId(cc.getSubCategoryId() != null ? cc.getSubCategoryId() : 0);
        request.setCoverUrl(defaultText(cc.getCoverUrl(), ""));
        request.setIntro(defaultText(cc.getIntro(), defaultText(cc.getSummary())));
        request.setSummary(limit(defaultText(cc.getSummary(), defaultText(cc.getIntro())), 500));
        request.setSyllabus(defaultText(cc.getSyllabus()));
        request.setMaterialUrl("");
        request.setMaterialText("");
        request.setAudience(defaultText(cc.getAudience(), cc.getTargetAudience()));
        request.setHighlights(defaultText(cc.getHighlights(), cc.getLearningOutcomes()));
        request.setDurationDays(cc.getDurationDays() != null ? cc.getDurationDays() : 0);
        request.setTotalHours(cc.getTotalHours() != null ? cc.getTotalHours() : BigDecimal.ZERO);
        request.setPrice(cc.getPrice() != null ? cc.getPrice() : BigDecimal.ZERO);
        request.setOriginalPrice(cc.getOriginalPrice() != null ? cc.getOriginalPrice() : BigDecimal.ZERO);
        request.setKeywords(defaultText(cc.getKeywords()));
        request.setIsFeatured(0);
        request.setIsFree(isExplicitFreePrice(cc, request.getPrice()) ? 1 : 0);
        List<CoursePlanDTO> plans = toCoursePlans(cc.getPlansJson(), cc.getDurationDays(), courseType);
        if (isOpenCourse(courseType) && plans.isEmpty()) {
            throw new IllegalStateException("Open course requires at least one importable plan");
        }
        request.setHasPlan(isOpenCourse(courseType) ? 1 : 0);
        request.setPlans(plans);

        CourseDetailVO course = courseService.create(publisher.getUserId(), BusinessRole.Code.TRAINER, request);

        cc.setReviewStatus(3);
        cc.setReviewedAt(LocalDateTime.now());
        cc.setImportedCourseId(course.getId());
        crawledCourseRepository.save(cc);

        log.info("Imported crawled course: crawledId={}, courseId={}, title={}", crawledId, course.getId(), cc.getTitle());
        return course.getId();
    }

    @Transactional
    public CrawledCourseDetailVO updateCrawledCourse(Integer crawledId, ImportCourseRequest edits) {
        CrawledCourse cc = crawledCourseRepository.findById(crawledId)
                .orElseThrow(() -> new NoSuchElementException("Crawled course not found"));
        if (cc.getReviewStatus() != 0) {
            throw new IllegalStateException(updateBlockedMessage(cc.getReviewStatus()));
        }
        applyCourseEdits(cc, edits);
        autoMapCourseCategory(cc);
        validateSelectedCourseCategory(cc, false);
        cc.setType(normalizeCourseType(cc.getType()));
        courseDuplicateService.checkAndApply(cc, CourseDuplicateService.CheckScene.REVIEW_SAVE);
        crawledCourseRepository.save(cc);
        return toCourseDetailVO(cc);
    }

    private void applyCourseEdits(CrawledCourse cc, ImportCourseRequest edits) {
        if (edits == null) {
            return;
        }
        if (edits.getCategoryId() != null) cc.setCategoryId(edits.getCategoryId());
        if (edits.getSubCategoryId() != null) cc.setSubCategoryId(edits.getSubCategoryId());
        if (edits.getTitle() != null) cc.setTitle(edits.getTitle());
        if (edits.getType() != null) {
            ensureAllowedCourseType(edits.getType());
            cc.setType(normalizeCourseType(edits.getType()));
        }
        if (edits.getCategoryNameRaw() != null) cc.setCategoryNameRaw(edits.getCategoryNameRaw());
        if (edits.getCoverUrl() != null) cc.setCoverUrl(edits.getCoverUrl());
        if (edits.getIntro() != null) cc.setIntro(edits.getIntro());
        if (edits.getSummary() != null) cc.setSummary(edits.getSummary());
        if (edits.getSyllabus() != null) cc.setSyllabus(edits.getSyllabus());
        if (edits.getAudience() != null) cc.setAudience(edits.getAudience());
        if (edits.getHighlights() != null) cc.setHighlights(edits.getHighlights());
        if (edits.getDurationDays() != null) cc.setDurationDays(edits.getDurationDays());
        if (edits.getTotalHours() != null) cc.setTotalHours(edits.getTotalHours());
        if (edits.getPrice() != null) cc.setPrice(edits.getPrice());
        if (edits.getOriginalPrice() != null) cc.setOriginalPrice(edits.getOriginalPrice());
        if (edits.getKeywords() != null) cc.setKeywords(edits.getKeywords());
        if (edits.getTrainerNameRaw() != null) cc.setTrainerNameRaw(edits.getTrainerNameRaw());
        if (edits.getTargetAudience() != null) cc.setTargetAudience(edits.getTargetAudience());
        if (edits.getLearningOutcomes() != null) cc.setLearningOutcomes(edits.getLearningOutcomes());
        if (edits.getPlansJson() != null) cc.setPlansJson(toJson(edits.getPlansJson()));
        normalizeCourseTiming(cc);
    }

    private void validateCourseBeforeImport(CrawledCourse cc) {
        if (cc.getTitle() == null || cc.getTitle().isBlank()) {
            throw new IllegalStateException("课程标题必填");
        }
        ensureAllowedCourseType(cc.getType());
        validateSelectedCourseCategory(cc, true);
        String contentType = rawJsonString(parseRawJson(cc), "content_type");
        if (contentType != null && Set.of("RECORDED_VIDEO", "DOCUMENT", "AUDIO").contains(contentType)) {
            throw new IllegalStateException("非课程内容不能导入 courses: " + contentType);
        }
    }

    private void validateSelectedCourseCategory(CrawledCourse cc, boolean required) {
        Integer categoryId = cc.getCategoryId();
        if (categoryId == null || categoryId <= 0) {
            if (required) {
                throw new IllegalStateException("导入前必须选择有效的平台课程分类");
            }
            return;
        }
        Category category = categoryService.getById(categoryId);
        if (category == null || !"COURSE_CATEGORY".equals(category.getType())) {
            throw new IllegalStateException("选择的平台分类不是课程分类");
        }
        Integer subCategoryId = cc.getSubCategoryId();
        if (subCategoryId != null && subCategoryId > 0) {
            Category subCategory = categoryService.getById(subCategoryId);
            if (subCategory == null || !"COURSE_CATEGORY".equals(subCategory.getType()) || !Objects.equals(subCategory.getParentId(), categoryId)) {
                throw new IllegalStateException("选择的二级分类不属于当前平台分类");
            }
        }
    }

    private Trainer resolveCoursePublisher(CrawledCourse course, ImportCourseRequest edits) {
        if (edits != null && edits.getTrainerId() != null && edits.getTrainerId() > 0) {
            return trainerService.findByIds(List.of(edits.getTrainerId())).stream()
                    .findFirst()
                    .orElseThrow(() -> new NoSuchElementException("关联专家不存在"));
        }

        String trainerName = normalizeTrainerName(course.getTrainerNameRaw());
        Optional<Trainer> matched = findTrainerByExactName(trainerName);
        if (matched.isPresent()) {
            Trainer trainer = matched.get();
            approveImportedTrainer(trainer);
            return trainer;
        }

        return createCoursePublisherFromCrawledCourse(course, trainerName);
    }

    private Optional<Trainer> findTrainerByExactName(String trainerName) {
        if (trainerName == null) {
            return Optional.empty();
        }

        Optional<Trainer> approved = trainerService.searchForAdmin(
                        trainerName, 2, PageRequest.of(0, 20))
                .getContent()
                .stream()
                .filter(t -> trainerName.equals(normalizeTrainerName(t.getName())))
                .findFirst();
        if (approved.isPresent()) {
            return approved;
        }

        return trainerService.searchForAdmin(trainerName, null, PageRequest.of(0, 20))
                .getContent()
                .stream()
                .filter(t -> trainerName.equals(normalizeTrainerName(t.getName())))
                .findFirst();
    }

    private Trainer createCoursePublisherFromCrawledCourse(CrawledCourse course, String trainerName) {
        String name = defaultText(trainerName, "外部课程讲师");
        User user = userService.createCrawlerImportedUser(
                buildCrawlerUsername(course.getSource(), "course_" + defaultText(course.getSourceCourseId(), String.valueOf(course.getId())), course.getId()),
                name,
                ""
        );

        TrainerRequest request = new TrainerRequest();
        request.setName(limit(name, 100));
        request.setTeachingName(limit(name, 64));
        request.setTitle("外部课程讲师");
        request.setGender(0);
        request.setBio("由爬取课程自动创建的讲师档案，请管理员后续补充资料。");
        request.setOneLineIntro(limit(defaultText(course.getTitle(), "外部课程讲师"), 255));
        request.setIntro(defaultText(course.getIntro(), course.getSummary()));
        request.setGoodAt(defaultText(course.getCategoryNameRaw(), course.getKeywords()));
        request.setSpecialties("[]");
        request.setExpertiseTags(limit(defaultText(course.getKeywords(), course.getCategoryNameRaw()), 500));
        request.setTeachingStyle("暂无");
        request.setExperienceYears(0);
        request.setTeachingYears(0);
        request.setProvinceId(0);
        request.setCityId(0);
        request.setAgreementSigned(true);
        request.setAgreementVersion("crawler-course-import-v1");

        TrainerResponse trainer = trainerService.save(user.getId(), request);
        roleApplyService.apply(user.getId(), BusinessRole.Code.TRAINER);
        roleApplyService.approve(user.getId(), BusinessRole.Code.TRAINER);

        Trainer imported = trainerService.findByIds(List.of(trainer.getId())).stream()
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("自动创建的课程讲师不存在"));
        approveImportedTrainer(imported);
        return imported;
    }

    private void approveImportedTrainer(Trainer trainer) {
        trainer.setStatus(2);
        if (trainer.getApprovedAt() == null) {
            trainer.setApprovedAt(LocalDateTime.now());
        }
    }

    private List<SaveTrainerBookRequest> toTrainerBooks(String booksJson) {
        List<Map<String, Object>> rawBooks = parseJson(booksJson, new TypeReference<>() {});
        if (rawBooks == null || rawBooks.isEmpty()) {
            return List.of();
        }

        List<SaveTrainerBookRequest> books = new ArrayList<>();
        int sortOrder = 0;
        for (Map<String, Object> raw : rawBooks) {
            String title = mapString(raw, "title", "name");
            if (title == null || title.isBlank()) {
                continue;
            }
            SaveTrainerBookRequest book = new SaveTrainerBookRequest();
            book.setTitle(limit(title.trim(), 200));
            book.setCoverUrl(limit(defaultText(mapString(raw, "cover_url", "coverUrl"), ""), 500));
            book.setPublisher(limit(defaultText(mapString(raw, "publisher"), ""), 200));
            book.setDescription(limit(defaultText(mapString(raw, "description", "intro", "summary"), ""), 1000));
            book.setBuyUrl(limit(defaultText(mapString(raw, "buy_url", "buyUrl", "source_url", "url"), ""), 500));
            book.setPublishDate(parseLocalDate(mapString(raw, "publish_date", "publishDate", "date")));
            book.setSortOrder(sortOrder++);
            books.add(book);
        }
        return books;
    }

    private void importTrainerCases(Integer trainerUserId, String casesJson) {
        List<Map<String, Object>> rawCases = parseJson(casesJson, new TypeReference<>() {});
        if (rawCases == null || rawCases.isEmpty()) {
            return;
        }

        int sortOrder = 0;
        for (Map<String, Object> raw : rawCases) {
            String title = mapString(raw, "title", "case_title", "name");
            if (title == null || title.isBlank()) {
                continue;
            }

            SaveTrainerCaseRequest request = new SaveTrainerCaseRequest();
            request.setCaseTitle(limit(title.trim(), 200));
            request.setEnterpriseName(limit(defaultText(mapString(raw, "client", "enterprise_name", "enterpriseName"), "来源网站客户案例"), 200));
            request.setIndustry(limit(defaultText(mapString(raw, "industry"), ""), 100));
            request.setTrainingTopic(limit(defaultText(mapString(raw, "training_topic", "topic"), ""), 200));
            request.setTrainingEffect(defaultText(mapString(raw, "training_effect", "effect"), ""));
            request.setTraineeCount(null);
            request.setProvinceId(0);
            request.setCityId(0);
            request.setDistrictId(0);
            request.setTownId(0);
            request.setTrainingAddress("暂无");
            request.setTrainingDate(parseLocalDate(mapString(raw, "date", "training_date", "trainingDate")));
            request.setDescription(defaultText(mapString(raw, "description", "summary", "intro"), ""));
            request.setCoverImage(limit(defaultText(mapString(raw, "cover_image", "coverImage", "image", "cover_url"), ""), 500));
            request.setSortOrder(sortOrder++);

            try {
                Integer caseId = trainerCaseService.createCase(trainerUserId, request, false).getId();
                trainerCaseService.approve(caseId, 0);
            } catch (Exception e) {
                log.warn("导入专家案例失败: trainerUserId={}, title={}, error={}", trainerUserId, request.getCaseTitle(), e.getMessage());
            }
        }
    }

    private List<CoursePlanDTO> toCoursePlans(String plansJson, Integer durationDays, String rawType) {
        String courseType = normalizeCourseType(rawType);
        if (!isOpenCourse(courseType)) {
            return List.of();
        }

        List<Map<String, Object>> rawPlans = parseJson(plansJson, new TypeReference<>() {});
        if (rawPlans == null || rawPlans.isEmpty()) {
            return List.of();
        }

        List<CoursePlanDTO> plans = new ArrayList<>();
        int sortOrder = 0;
        for (Map<String, Object> raw : rawPlans) {
            String startDate = mapString(raw, "start_date", "start_time", "startTime", "startDate", "date");
            LocalDate date = parseLocalDate(startDate);
            if (date == null) {
                continue;
            }

            CoursePlanDTO plan = new CoursePlanDTO();
            plan.setStartTime(LocalDateTime.of(date, LocalTime.of(9, 0)));
            int days = durationDays != null && durationDays > 0 ? durationDays : 1;
            plan.setEndTime(LocalDateTime.of(date.plusDays(days - 1L), LocalTime.of(18, 0)));
            plan.setDistrictId(defaultInt(mapInteger(raw, "districtId", "district_id")));
            plan.setSortOrder(sortOrder++);

            if ("OPEN_ONLINE".equals(courseType)) {
                plan.setProvinceId(0);
                plan.setCityId(0);
                plan.setAddress("");
                plan.setOnlineUrl(defaultText(mapString(raw, "online_url", "onlineUrl", "url"), "\u5728\u7ebf\u8bfe\u7a0b"));
            } else {
                String location = defaultText(mapString(raw, "location", "city", "address"), "");
                String address = defaultText(mapString(raw, "address", "location", "city"), "");
                Integer provinceId = defaultInt(mapInteger(raw, "provinceId", "province_id"));
                Integer cityId = defaultInt(mapInteger(raw, "cityId", "city_id"));
                RegionMatch region = provinceId > 0 && cityId > 0 ? RegionMatch.empty() : resolveRegion(location + " " + address);
                Integer resolvedProvinceId = provinceId > 0 ? provinceId : region.provinceId;
                Integer resolvedCityId = cityId > 0 ? cityId : region.cityId;
                if (resolvedProvinceId == null || resolvedProvinceId <= 0 || resolvedCityId == null || resolvedCityId <= 0) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "无法根据线下开课地址解析省市，请检查地址或选择省市：" + defaultText(address, location));
                }
                plan.setProvinceId(resolvedProvinceId);
                plan.setCityId(resolvedCityId);
                plan.setAddress(address.isBlank() ? region.cityName : address);
                plan.setOnlineUrl("");
            }
            plans.add(plan);
        }
        return plans;
    }

    private boolean isOpenCourse(String rawType) {
        String normalized = normalizeCourseType(rawType);
        return "OPEN_OFFLINE".equals(normalized) || "OPEN_ONLINE".equals(normalized);
    }

    private String normalizeCourseType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return "OPEN_OFFLINE";
        }
        String normalized = rawType.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "OPEN_ONLINE", "OPEN_OFFLINE", "INTERNAL" -> normalized;
            case "ONLINE" -> "OPEN_ONLINE";
            case "OFFLINE" -> "OPEN_OFFLINE";
            default -> "OPEN_OFFLINE";
        };
    }

    private void ensureAllowedCourseType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            throw new IllegalStateException("课程类型必填");
        }
        String normalized = rawType.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("OPEN_ONLINE", "OPEN_OFFLINE", "INTERNAL", "ONLINE", "OFFLINE").contains(normalized)) {
            throw new IllegalStateException("课程类型非法: " + rawType);
        }
    }

    private RegionMatch resolveRegion(String rawLocation) {
        String location = defaultText(rawLocation, "").trim();
        if (location.isBlank() || "暂无".equals(location)) {
            return RegionMatch.empty();
        }

        for (String keyword : regionKeywords(location)) {
            RegionMatch matched = resolveRegionByKeyword(keyword, location);
            if (!matched.isEmpty()) {
                return matched;
            }
        }
        return RegionMatch.empty();
    }

    private List<String> regionKeywords(String location) {
        LinkedHashSet<String> keywords = new LinkedHashSet<>();
        String text = location
                .replaceAll("[,，、/|]+", " ")
                .replaceAll("\\s+", " ")
                .trim();

        for (String municipality : List.of("北京", "上海", "天津", "重庆")) {
            if (text.contains(municipality)) {
                keywords.add(municipality);
                keywords.add(municipality + "市");
            }
        }

        for (String city : List.of("广州", "深圳", "杭州", "苏州", "南京", "成都", "武汉", "西安", "长沙", "郑州", "青岛", "厦门", "宁波", "无锡", "佛山", "东莞", "合肥", "福州", "济南", "昆明", "南昌", "南宁", "贵阳", "太原", "石家庄", "沈阳", "大连", "长春", "哈尔滨", "兰州", "银川", "西宁", "乌鲁木齐", "海口", "三亚")) {
            if (text.contains(city)) {
                keywords.add(city);
                keywords.add(city + "市");
            }
        }

        Matcher cityMatcher = Pattern.compile("([\\u4e00-\\u9fa5]{2,12}?市)").matcher(text);
        while (cityMatcher.find()) {
            String city = cityMatcher.group(1);
            keywords.add(city);
            keywords.add(city.replace("市", ""));
        }

        Matcher districtMatcher = Pattern.compile("([\\u4e00-\\u9fa5]{2,10}?(?:区|县|旗))").matcher(text);
        while (districtMatcher.find()) {
            keywords.add(districtMatcher.group(1));
        }

        keywords.add(text);
        return keywords.stream()
                .map(String::trim)
                .filter(s -> !s.isBlank() && !"暂无".equals(s) && !"待定".equals(s))
                .toList();
    }

    private RegionMatch resolveRegionByKeyword(String keyword, String originalLocation) {
        List<String> candidates = new ArrayList<>();
        candidates.add(keyword);
        if (keyword.endsWith("市")) {
            candidates.add(keyword.substring(0, keyword.length() - 1));
        }

        for (String candidate : candidates) {
            RegionMatch region = resolveRegionFromMatches(regionService.search(candidate, 2), originalLocation, candidate);
            if (region.isEmpty()) {
                region = resolveRegionFromMatches(regionService.search(candidate, null), originalLocation, candidate);
            }
            if (!region.isEmpty()) {
                return region;
            }
        }
        return RegionMatch.empty();
    }

    private RegionMatch resolveRegionFromMatches(List<RegionVO> matches, String originalLocation, String candidate) {
        if (matches == null || matches.isEmpty()) {
            return RegionMatch.empty();
        }
        RegionVO region = matches.stream()
                .filter(r -> regionNameMatches(originalLocation, candidate, r.getName()))
                .findFirst()
                .orElse(matches.get(0));
        return toRegionMatch(region);
    }

    private boolean regionNameMatches(String originalLocation, String keyword, String regionName) {
        if (regionName == null || regionName.isBlank()) {
            return false;
        }
        String normalizedOriginal = originalLocation.replace("市", "");
        String normalizedKeyword = keyword.replace("市", "");
        String normalizedRegion = regionName.replace("市", "");
        return normalizedOriginal.contains(normalizedRegion)
                || normalizedKeyword.contains(normalizedRegion)
                || normalizedRegion.contains(normalizedKeyword);
    }

    private RegionMatch toRegionMatch(RegionVO region) {
        if (region == null || region.getId() == null) {
            return RegionMatch.empty();
        }
        if (Objects.equals(region.getLevel(), 1) && isMunicipality(region.getName())) {
            return new RegionMatch(region.getId(), region.getId(), region.getName());
        }
        if (region.getCode() != null) {
            try {
                var detail = regionService.getDetail(region.getCode());
                if (detail != null && detail.getPath() != null && !detail.getPath().isEmpty()) {
                    Integer provinceId = 0;
                    Integer cityId = 0;
                    String cityName = "";
                    for (RegionVO item : detail.getPath()) {
                        if (item.getLevel() != null && item.getLevel() == 1) {
                            provinceId = item.getId();
                        } else if (item.getLevel() != null && item.getLevel() == 2) {
                            cityId = item.getId();
                            cityName = item.getName();
                        }
                    }
                    if (cityId == 0 && Objects.equals(region.getLevel(), 2)) {
                        cityId = region.getId();
                        cityName = region.getName();
                    }
                    return new RegionMatch(provinceId, cityId, defaultText(cityName, region.getName()));
                }
            } catch (Exception ignored) {
            }
        }
        if (Objects.equals(region.getLevel(), 2)) {
            return new RegionMatch(0, region.getId(), region.getName());
        }
        return RegionMatch.empty();
    }

    private boolean isMunicipality(String name) {
        if (name == null) {
            return false;
        }
        String normalized = name.replace("市", "");
        return Set.of("北京", "上海", "天津", "重庆").contains(normalized);
    }

    /**
     * 驳回爬取课程
     */
    public void rejectCrawledCourse(Integer id, String reason) {
        CrawledCourse cc = crawledCourseRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        if (cc.getReviewStatus() != 0) {
            throw new IllegalStateException("只有待审核课程可以驳回");
        }
        cc.setReviewStatus(2); // 已驳回
        cc.setReviewRejectReason(reason);
        cc.setReviewedAt(LocalDateTime.now());
        crawledCourseRepository.save(cc);
    }

    /**
     * 恢复已驳回爬取课程为待审核
     */
    @Transactional
    public void restoreCrawledCourse(Integer id) {
        CrawledCourse cc = crawledCourseRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        if (!Objects.equals(cc.getReviewStatus(), 2)) {
            throw new IllegalStateException("只有已驳回课程可以恢复待审核");
        }
        if (cc.getImportedCourseId() != null && cc.getImportedCourseId() > 0) {
            throw new IllegalStateException("该记录已关联正式课程，不能恢复为待审核");
        }
        cc.setReviewStatus(0);
        cc.setReviewRejectReason(null);
        cc.setReviewedAt(null);
        crawledCourseRepository.save(cc);
    }

    // ==================== 回调处理 ====================

    /**
     * 处理 Python 爬虫服务的回调
     */
    @Transactional
    public void handleCallback(String token, CrawlCallbackRequest request) {
        // 校验 token
        if (!Objects.equals(token, callbackToken)) {
            throw new SecurityException("回调 token 无效");
        }

        CrawlJob job = crawlJobRepository.findByCrawlerJobId(request.getJobId())
                .orElseThrow(() -> new NoSuchElementException("任务不存在: " + request.getJobId()));

        switch (request.getEvent()) {
            case "progress" -> {
                applyJobProgress(job, request);
                crawlJobRepository.save(job);
            }
            case "batch" -> {
                List<Map<String, Object>> items = request.getItems();
                if (items == null || items.isEmpty()) return;

                int successCount = 0;
                int errorCount = 0;
                int duplicateCount = 0;

                if ("TRAINER".equals(job.getDataType())) {
                    for (Map<String, Object> item : items) {
                        try {
                            saveCrawledTrainer(job.getSource(), item);
                            successCount++;
                        } catch (Exception e) {
                            errorCount++;
                            log.warn("保存爬取专家失败: {}", e.getMessage());
                        }
                    }
                } else if ("COURSE".equals(job.getDataType())) {
                    for (Map<String, Object> item : items) {
                        try {
                            saveCrawledCourse(job.getSource(), item);
                            successCount++;
                        } catch (Exception e) {
                            errorCount++;
                            log.warn("保存爬取课程失败: {}", e.getMessage());
                        }
                    }
                }

                applyJobProgress(job, request);
                job.setProcessedCount(maxInt(job.getProcessedCount(), job.getSuccessCount() + job.getDuplicateCount() + job.getErrorCount() + items.size()));
                job.setSuccessCount(job.getSuccessCount() + successCount);
                job.setDuplicateCount(job.getDuplicateCount() + duplicateCount);
                job.setErrorCount(job.getErrorCount() + errorCount);
                job.setProgressMessage("已接收并保存 " + items.size() + " 条，本批成功 " + successCount + " 条");
                crawlJobRepository.save(job);
            }
            case "complete" -> {
                job.setStatus(2); // 已完成
                if (request.getTotal() != null) {
                    job.setTotalCount(request.getTotal());
                }
                applyJobProgress(job, request);
                job.setProcessedCount(maxInt(job.getProcessedCount(), job.getSuccessCount() + job.getDuplicateCount() + job.getErrorCount()));
                job.setProgressMessage(defaultText(request.getMessage(), "爬取完成"));
                job.setFinishedAt(LocalDateTime.now());
                crawlJobRepository.save(job);
                log.info("爬取任务完成: jobId={}, total={}", request.getJobId(), request.getTotal());
            }
            case "error" -> {
                job.setStatus(3); // 失败
                job.setErrorMessage(request.getError());
                job.setProgressMessage(defaultText(request.getMessage(), "爬取失败"));
                applyJobProgress(job, request);
                job.setFinishedAt(LocalDateTime.now());
                crawlJobRepository.save(job);
                log.error("爬取任务失败: jobId={}, error={}", request.getJobId(), request.getError());
            }
        }
    }

    // ==================== 内部方法 ====================

    /**
     * 保存爬取的专家数据到中间表（含去重检查）
     */
    private void saveCrawledTrainer(String source, Map<String, Object> item) {
        String sourceTrainerId = (String) item.get("source_trainer_id");
        String sourceUrl = (String) item.get("source_url");

        // 唯一约束去重：同来源同 ID 不重复入库
        Optional<CrawledTrainer> existing = crawledTrainerRepository
                .findBySourceAndSourceTrainerId(source, sourceTrainerId);
        if (existing.isPresent()) {
            // 更新已有记录
            CrawledTrainer ct = existing.get();
            updateCrawledTrainerFields(ct, item);
            crawledTrainerRepository.save(ct);
            return;
        }

        CrawledTrainer ct = new CrawledTrainer();
        ct.setSource(source);
        ct.setSourceUrl(sourceUrl != null ? sourceUrl : "");
        ct.setSourceTrainerId(sourceTrainerId);
        updateCrawledTrainerFields(ct, item);

        // 跨源去重检查
        checkTrainerDuplicate(ct);

        crawledTrainerRepository.save(ct);
    }

    private void updateCrawledTrainerFields(CrawledTrainer ct, Map<String, Object> item) {
        ct.setName(getString(item, "name"));
        ct.setTeachingName(getString(item, "teaching_name"));
        ct.setAvatar(getString(item, "avatar"));
        ct.setTitle(getString(item, "title"));
        ct.setGender(getInt(item, "gender", 0));
        ct.setOneLineIntro(getString(item, "one_line_intro"));
        ct.setBio(getString(item, "bio"));
        ct.setIntro(getString(item, "intro"));
        ct.setBackground(getString(item, "background"));
        ct.setGoodAt(getString(item, "good_at"));
        ct.setSpecialties(getString(item, "specialties"));
        ct.setExpertiseTags(getString(item, "expertise_tags"));
        ct.setTeachingStyle(getString(item, "teaching_style"));
        ct.setExperienceYears(getInt(item, "experience_years", null));
        ct.setTeachingYears(getInt(item, "teaching_years", null));
        ct.setPartialClients(getString(item, "partial_clients"));
        ct.setEducationJson(toJson(item.get("education_json")));
        ct.setExperienceJson(toJson(item.get("experience_json")));
        ct.setHonorsJson(toJson(item.get("honors_json")));
        ct.setBooksJson(toJson(item.get("books_json")));
        ct.setCoursesJson(toJson(item.get("courses_json")));
        ct.setCasesJson(toJson(item.get("cases_json")));
        ct.setEvaluationJson(toJson(item.get("evaluation_json")));
        ct.setRawJson(toJson(item.getOrDefault("raw_json", item)));
    }

    /**
     * 保存爬取的课程数据到中间表
     */
    private void saveCrawledCourse(String source, Map<String, Object> item) {
        String sourceCourseId = (String) item.get("source_course_id");
        String sourceUrl = (String) item.get("source_url");

        Optional<CrawledCourse> existing = crawledCourseRepository
                .findBySourceAndSourceCourseId(source, sourceCourseId);
        if (existing.isPresent()) {
            CrawledCourse cc = existing.get();
            if (Objects.equals(cc.getReviewStatus(), 3)) {
                log.info("跳过已入库爬取课程的同源覆盖更新: crawledId={}, source={}, sourceCourseId={}",
                        cc.getId(), source, sourceCourseId);
                return;
            }
            updateCrawledCourseFields(cc, item);
            checkCourseDuplicate(cc);
            crawledCourseRepository.save(cc);
            return;
        }

        CrawledCourse cc = new CrawledCourse();
        cc.setSource(source);
        cc.setSourceUrl(sourceUrl != null ? sourceUrl : "");
        cc.setSourceCourseId(sourceCourseId);
        updateCrawledCourseFields(cc, item);

        // 跨源去重检查
        checkCourseDuplicate(cc);

        crawledCourseRepository.save(cc);
    }

    private void updateCrawledCourseFields(CrawledCourse cc, Map<String, Object> item) {
        cc.setTitle(getString(item, "title"));
        cc.setType(normalizeCourseType(getString(item, "type")));
        cc.setCategoryNameRaw(getString(item, "category_name_raw"));
        Integer categoryId = getInt(item, "category_id", null);
        if (categoryId != null && categoryId > 0) {
            cc.setCategoryId(categoryId);
        }
        Integer subCategoryId = getInt(item, "sub_category_id", null);
        if (subCategoryId != null && subCategoryId > 0) {
            cc.setSubCategoryId(subCategoryId);
        }
        cc.setCoverUrl(getString(item, "cover_url"));
        cc.setIntro(getString(item, "intro"));
        cc.setSummary(getString(item, "summary"));
        cc.setSyllabus(getString(item, "syllabus"));
        cc.setAudience(getString(item, "audience"));
        cc.setHighlights(getString(item, "highlights"));
        cc.setDurationDays(getInt(item, "duration_days", 0));
        cc.setTotalHours(getBigDecimal(item, "total_hours", BigDecimal.ZERO));
        cc.setPrice(getBigDecimal(item, "price", BigDecimal.ZERO));
        cc.setOriginalPrice(getBigDecimal(item, "original_price", BigDecimal.ZERO));
        cc.setKeywords(getString(item, "keywords"));
        cc.setTrainerNameRaw(getString(item, "trainer_name_raw"));
        cc.setPlansJson(toJson(item.get("plans_json")));
        cc.setEvaluationJson(toJson(item.get("evaluation_json")));
        cc.setTargetAudience(getString(item, "target_audience"));
        cc.setLearningOutcomes(getString(item, "learning_outcomes"));
        cc.setServicesJson(toJson(item.get("services_json")));
        cc.setRawJson(toJson(item.getOrDefault("raw_json", item)));
        autoMapCourseCategory(cc);
        normalizeCourseTiming(cc);
    }

    private void normalizeCourseTiming(CrawledCourse cc) {
        Integer durationDays = cc.getDurationDays();
        BigDecimal totalHours = cc.getTotalHours();
        if (durationDays != null && durationDays > 0 && (totalHours == null || totalHours.compareTo(BigDecimal.ZERO) <= 0)) {
            cc.setTotalHours(BigDecimal.valueOf(durationDays).multiply(BigDecimal.valueOf(6)));
        }
    }

    private void autoMapCourseCategory(CrawledCourse cc) {
        if (cc.getCategoryId() != null && cc.getCategoryId() > 0) {
            return;
        }
        CategoryTreeVO matched = matchCourseCategory(cc.getCategoryNameRaw());
        if (matched == null) {
            matched = matchCourseCategory(String.join(" ",
                    defaultText(cc.getTitle(), ""),
                    defaultText(cc.getKeywords(), ""),
                    defaultText(cc.getSummary(), "")));
        }
        if (matched != null && matched.getId() != null) {
            cc.setCategoryId(matched.getId());
            cc.setSubCategoryId(0);
        }
    }

    private CategoryTreeVO matchCourseCategory(String text) {
        String normalizedText = normalizeCategoryText(text);
        if (normalizedText.isBlank() || normalizeCategoryText("\u6682\u65e0").equals(normalizedText)) {
            return null;
        }
        List<CategoryTreeVO> categories = categoryService.getTree("COURSE_CATEGORY");
        for (CategoryTreeVO category : categories) {
            String name = normalizeCategoryText(category.getName());
            if (!name.isBlank() && (normalizedText.equals(name) || normalizedText.contains(name) || name.contains(normalizedText))) {
                return category;
            }
        }
        for (CategoryTreeVO category : categories) {
            for (String alias : courseCategoryAliases(category.getName())) {
                String normalizedAlias = normalizeCategoryText(alias);
                if (!normalizedAlias.isBlank() && normalizedText.contains(normalizedAlias)) {
                    return category;
                }
            }
        }
        return null;
    }

    private String normalizeCategoryText(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[\\s\\p{Punct}\uff0c\u3001\uff1a\uff1b\uff08\uff09\u3010\u3011\u300a\u300b]+", "")
                .replace("\u8bfe\u7a0b", "")
                .replace("\u57f9\u8bad\u73ed", "")
                .replace("\u57f9\u8bad", "")
                .replace("\u516c\u5f00\u8bfe", "")
                .trim();
    }

    private List<String> courseCategoryAliases(String categoryName) {
        String name = normalizeCategoryText(categoryName);
        if (name.equals(normalizeCategoryText("\u7ecf\u8425\u6218\u7565"))) {
            return List.of("\u6218\u7565", "\u6218\u7565\u7ba1\u7406", "\u7ecf\u8425", "\u5546\u4e1a\u6a21\u5f0f", "\u4f01\u4e1a\u6218\u7565");
        }
        if (name.equals(normalizeCategoryText("\u5e02\u573a\u8425\u9500"))) {
            return List.of("\u8425\u9500", "\u8425\u9500\u7ba1\u7406", "\u5e02\u573a", "\u54c1\u724c", "\u7f51\u7edc\u8425\u9500");
        }
        if (name.equals(normalizeCategoryText("\u7814\u53d1\u7ba1\u7406"))) {
            return List.of("\u7814\u53d1", "\u751f\u4ea7\u7814\u53d1", "\u4ea7\u54c1\u7814\u53d1", "\u6280\u672f\u7814\u53d1");
        }
        if (name.equals(normalizeCategoryText("\u9500\u552e\u7ba1\u7406"))) {
            return List.of("\u9500\u552e", "\u5927\u5ba2\u6237", "\u6e20\u9053", "\u8c08\u5224", "\u95e8\u5e97", "\u7ec8\u7aef");
        }
        if (name.equals(normalizeCategoryText("\u91c7\u8d2d\u7ba1\u7406"))) {
            return List.of("\u91c7\u8d2d", "\u91c7\u8d2d\u7269\u6d41", "\u62db\u6807", "\u4f9b\u5e94\u5546");
        }
        if (name.equals(normalizeCategoryText("\u751f\u4ea7\u7ba1\u7406"))) {
            return List.of("\u751f\u4ea7", "\u5de5\u5382", "\u7cbe\u76ca", "\u73b0\u573a", "\u73ed\u7ec4", "\u8bbe\u5907", "\u5b89\u5168\u751f\u4ea7");
        }
        if (name.equals(normalizeCategoryText("\u7269\u6d41\u7ba1\u7406"))) {
            return List.of("\u7269\u6d41", "\u4f9b\u5e94\u94fe", "\u4ed3\u50a8", "\u5e93\u5b58");
        }
        if (name.equals(normalizeCategoryText("\u5ba2\u6237\u670d\u52a1"))) {
            return List.of("\u5ba2\u6237", "\u5ba2\u670d", "\u670d\u52a1", "\u5ba2\u6237\u4f53\u9a8c");
        }
        if (name.equals(normalizeCategoryText("\u8d22\u52a1\u7a0e\u52a1"))) {
            return List.of("\u8d22\u52a1", "\u8d22\u52a1\u7ba1\u7406", "\u7a0e\u52a1", "\u4f1a\u8ba1", "\u6210\u672c", "\u9884\u7b97");
        }
        if (name.equals(normalizeCategoryText("\u4eba\u529b\u8d44\u6e90"))) {
            return List.of("\u4eba\u529b", "\u4eba\u8d44", "\u4eba\u529b\u8d44\u6e90", "\u62db\u8058", "\u7ee9\u6548", "\u85aa\u916c", "\u52b3\u52a8\u5173\u7cfb");
        }
        if (name.equals(normalizeCategoryText("\u57f9\u8bad\u53d1\u5c55"))) {
            return List.of("\u57f9\u8bad\u53d1\u5c55", "\u5185\u8bad\u5e08", "\u8bfe\u7a0b\u5f00\u53d1", "\u4eba\u624d\u53d1\u5c55", "\u5b66\u4e60\u53d1\u5c55");
        }
        if (name.equals(normalizeCategoryText("\u8d28\u91cf\u7ba1\u7406"))) {
            return List.of("\u8d28\u91cf", "\u54c1\u8d28", "iso", "\u516d\u897f\u683c\u739b");
        }
        if (name.equals(normalizeCategoryText("\u9879\u76ee\u7ba1\u7406"))) {
            return List.of("\u9879\u76ee", "pmp", "\u654f\u6377");
        }
        if (name.equals(normalizeCategoryText("\u9886\u5bfc\u529b"))) {
            return List.of("\u9886\u5bfc", "\u9886\u5bfc\u827a\u672f", "\u7ba1\u7406\u827a\u672f", "\u7ba1\u7406\u6280\u80fd", "\u4e2d\u9ad8\u5c42", "\u6267\u884c\u529b");
        }
        if (name.equals(normalizeCategoryText("\u804c\u4e1a\u7d20\u517b"))) {
            return List.of("\u804c\u4e1a\u7d20\u517b", "\u6c9f\u901a", "\u65f6\u95f4\u7ba1\u7406", "\u5546\u52a1\u793c\u4eea", "\u538b\u529b", "\u60c5\u7eea");
        }
        if (name.equals(normalizeCategoryText("\u804c\u4e1a\u6280\u80fd"))) {
            return List.of("\u804c\u4e1a\u6280\u80fd", "\u7efc\u5408\u6280\u80fd", "\u529e\u516c", "excel", "ppt", "\u6f14\u8bb2", "\u6c47\u62a5");
        }
        if (name.equals(normalizeCategoryText("MBA/\u603b\u88c1\u73ed"))) {
            return List.of("mba", "\u603b\u88c1", "\u9ad8\u7ba1", "\u8463\u4e8b\u957f");
        }
        if (name.equals(normalizeCategoryText("\u56fd\u5b66/\u5fc3\u7406\u5b66"))) {
            return List.of("\u56fd\u5b66", "\u5fc3\u7406", "\u6613\u7ecf");
        }
        if (name.equals(normalizeCategoryText("\u8bed\u8a00"))) {
            return List.of("\u8bed\u8a00", "\u82f1\u8bed");
        }
        if (name.equals(normalizeCategoryText("\u884c\u653f/\u6cd5\u89c4"))) {
            return List.of("\u884c\u653f", "\u6cd5\u5f8b", "\u6cd5\u52a1", "\u6cd5\u89c4", "\u5408\u89c4");
        }
        if (name.equals(normalizeCategoryText("\u515a\u653f\u7231\u56fd"))) {
            return List.of("\u515a\u5efa", "\u515a\u653f", "\u7ea2\u8272", "\u7231\u56fd");
        }
        if (name.equals(normalizeCategoryText("\u5bb6\u5ead\u4eb2\u5b50"))) {
            return List.of("\u5bb6\u5ead", "\u4eb2\u5b50", "\u6559\u80b2\u5b69\u5b50");
        }
        if (name.equals(normalizeCategoryText("\u5065\u5eb7\u517b\u751f"))) {
            return List.of("\u5065\u5eb7", "\u517b\u751f", "\u4e2d\u533b");
        }
        if (name.equals(normalizeCategoryText("\u653f\u7ecf"))) {
            return List.of("\u653f\u7ecf", "\u5b8f\u89c2\u7ecf\u6d4e", "\u7ecf\u6d4e", "\u653f\u7b56");
        }
        if (name.equals(normalizeCategoryText("\u65b0\u5a92\u4f53"))) {
            return List.of("\u65b0\u5a92\u4f53", "\u77ed\u89c6\u9891", "\u76f4\u64ad", "\u79c1\u57df", "\u6296\u97f3");
        }
        if (name.equals(normalizeCategoryText("\u65b0\u6280\u672f"))) {
            return List.of("\u65b0\u6280\u672f", "\u4eba\u5de5\u667a\u80fd", "\u6570\u5b57\u5316", "\u5927\u6570\u636e", "\u4e92\u8054\u7f51", "ai", "chatgpt");
        }
        if (name.equals(normalizeCategoryText("\u5176\u5b83"))) {
            return List.of("\u5176\u4ed6", "\u5176\u5b83", "\u7ebf\u4e0a");
        }
        return List.of();
    }

    /**
     * 专家去重检查（跨源：按姓名匹配正式表）
     */
    private void checkTrainerDuplicate(CrawledTrainer ct) {
        if (ct.getName() == null || ct.getName().isBlank()) {
            ct.setDedupStatus(1); // 无重复（无法判断）
            return;
        }
        // 在正式表中按姓名搜索
        Page<Trainer> matched = trainerService.searchForAdmin(ct.getName(), null,
                PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "id")));
        if (!matched.isEmpty()) {
            Trainer first = matched.getContent().get(0);
            if (ct.getName().equals(first.getName())) {
                ct.setDedupStatus(2); // 疑似重复
                ct.setDedupTrainerId(first.getId());
                ct.setDedupReason("姓名与现有专家[" + first.getName() + "]匹配");
                return;
            }
        }
        ct.setDedupStatus(1); // 无重复
    }

    /**
     * 课程去重检查
     */
    private void checkCourseDuplicate(CrawledCourse cc) {
        courseDuplicateService.checkAndApply(cc, CourseDuplicateService.CheckScene.CALLBACK_SAVE);
    }

    // ==================== VO 转换 ====================

    private CrawledTrainerVO toTrainerVO(CrawledTrainer ct) {
        CrawledTrainerVO vo = new CrawledTrainerVO();
        vo.setId(ct.getId());
        vo.setSource(ct.getSource());
        vo.setSourceUrl(ct.getSourceUrl());
        vo.setName(ct.getName());
        vo.setTitle(ct.getTitle());
        vo.setAvatar(ct.getAvatar());
        vo.setExpertiseTags(ct.getExpertiseTags());
        vo.setTeachingStyle(ct.getTeachingStyle());
        vo.setExperienceYears(ct.getExperienceYears());
        vo.setDedupStatus(ct.getDedupStatus());
        vo.setDedupStatusText(dedupStatusText(ct.getDedupStatus()));
        vo.setDedupReason(ct.getDedupReason());
        vo.setReviewStatus(ct.getReviewStatus());
        vo.setReviewStatusText(reviewStatusText(ct.getReviewStatus()));
        vo.setCreatedAt(ct.getCreatedAt());
        return vo;
    }

    private CrawledTrainerDetailVO toTrainerDetailVO(CrawledTrainer ct) {
        CrawledTrainerDetailVO vo = new CrawledTrainerDetailVO();
        vo.setId(ct.getId());
        vo.setSource(ct.getSource());
        vo.setSourceUrl(ct.getSourceUrl());
        vo.setSourceTrainerId(ct.getSourceTrainerId());
        vo.setName(ct.getName());
        vo.setTeachingName(ct.getTeachingName());
        vo.setAvatar(ct.getAvatar());
        vo.setTitle(ct.getTitle());
        vo.setGender(ct.getGender());
        vo.setOneLineIntro(ct.getOneLineIntro());
        vo.setBio(ct.getBio());
        vo.setIntro(ct.getIntro());
        vo.setBackground(ct.getBackground());
        vo.setGoodAt(ct.getGoodAt());
        vo.setSpecialties(ct.getSpecialties());
        vo.setExpertiseTags(ct.getExpertiseTags());
        vo.setTeachingStyle(ct.getTeachingStyle());
        vo.setExperienceYears(ct.getExperienceYears());
        vo.setTeachingYears(ct.getTeachingYears());
        vo.setProvinceId(ct.getProvinceId());
        vo.setCityId(ct.getCityId());
        vo.setPartialClients(ct.getPartialClients());
        vo.setDedupStatus(ct.getDedupStatus());
        vo.setDedupStatusText(dedupStatusText(ct.getDedupStatus()));
        vo.setDedupTrainerId(ct.getDedupTrainerId());
        vo.setDedupReason(ct.getDedupReason());
        vo.setReviewStatus(ct.getReviewStatus());
        vo.setReviewStatusText(reviewStatusText(ct.getReviewStatus()));
        vo.setReviewRejectReason(ct.getReviewRejectReason());
        vo.setReviewedAt(ct.getReviewedAt());
        vo.setImportedTrainerId(ct.getImportedTrainerId());
        vo.setCreatedAt(ct.getCreatedAt());
        vo.setRawJson(parseJson(ct.getRawJson(), new TypeReference<>() {}));

        // 解析 JSON 子数据
        vo.setEducationList(parseJson(ct.getEducationJson(), new TypeReference<>() {}));
        vo.setExperienceList(parseJson(ct.getExperienceJson(), new TypeReference<>() {}));
        vo.setHonorsList(parseJson(ct.getHonorsJson(), new TypeReference<>() {}));
        vo.setBooksList(parseJson(ct.getBooksJson(), new TypeReference<>() {}));
        vo.setCoursesList(parseJson(ct.getCoursesJson(), new TypeReference<>() {}));
        vo.setCasesList(parseJson(ct.getCasesJson(), new TypeReference<>() {}));

        return vo;
    }

    private Map<Integer, String> courseCategoryNames(CrawledCourse cc) {
        Set<Integer> ids = new HashSet<>();
        if (cc.getCategoryId() != null && cc.getCategoryId() > 0) {
            ids.add(cc.getCategoryId());
        }
        if (cc.getSubCategoryId() != null && cc.getSubCategoryId() > 0) {
            ids.add(cc.getSubCategoryId());
        }
        return ids.isEmpty() ? Collections.emptyMap() : categoryService.getNameMap(ids);
    }

    private String courseTypeLabel(String type) {
        return switch (normalizeCourseType(type)) {
            case "OPEN_ONLINE" -> "\u7ebf\u4e0a\u516c\u5f00\u8bfe";
            case "OPEN_OFFLINE" -> "\u7ebf\u4e0b\u516c\u5f00\u8bfe";
            case "INTERNAL" -> "\u5185\u8bad\u8bfe";
            default -> "\u672a\u77e5";
        };
    }

    private CrawledCourseVO toCourseVO(CrawledCourse cc) {
        CrawledCourseVO vo = new CrawledCourseVO();
        vo.setId(cc.getId());
        vo.setSource(cc.getSource());
        vo.setSourceUrl(cc.getSourceUrl());
        vo.setTitle(cc.getTitle());
        vo.setType(normalizeCourseType(cc.getType()));
        vo.setTypeLabel(courseTypeLabel(cc.getType()));
        vo.setCategoryId(cc.getCategoryId());
        vo.setSubCategoryId(cc.getSubCategoryId());
        Map<Integer, String> categoryNames = courseCategoryNames(cc);
        vo.setCategoryName(categoryNames.get(cc.getCategoryId()));
        vo.setSubCategoryName(categoryNames.get(cc.getSubCategoryId()));
        vo.setCategoryNameRaw(cc.getCategoryNameRaw());
        vo.setCoverUrl(cc.getCoverUrl());
        vo.setPrice(cc.getPrice());
        Map<String, Object> rawJson = parseRawJson(cc);
        vo.setPriceRaw(rawJsonString(rawJson, "price_raw"));
        vo.setPriceParseStatus(rawJsonString(rawJson, "price_parse_status"));
        vo.setContentType(rawJsonString(rawJson, "content_type"));
        vo.setDurationDays(cc.getDurationDays());
        vo.setTrainerNameRaw(cc.getTrainerNameRaw());
        vo.setDedupStatus(cc.getDedupStatus());
        vo.setDedupStatusText(dedupStatusText(cc.getDedupStatus()));
        vo.setDedupTargetType(cc.getDedupTargetType());
        vo.setDedupTargetId(cc.getDedupTargetId());
        vo.setDedupMatchType(cc.getDedupMatchType());
        vo.setDedupScore(cc.getDedupScore());
        vo.setDedupCheckedAt(cc.getDedupCheckedAt());
        vo.setDedupReason(cc.getDedupReason());
        vo.setReviewStatus(cc.getReviewStatus());
        vo.setReviewStatusText(reviewStatusText(cc.getReviewStatus()));
        vo.setReviewRejectReason(cc.getReviewRejectReason());
        vo.setReviewedAt(cc.getReviewedAt());
        vo.setImportedCourseId(cc.getImportedCourseId());
        vo.setCreatedAt(cc.getCreatedAt());
        return vo;
    }

    private CrawledCourseDetailVO toCourseDetailVO(CrawledCourse cc) {
        CrawledCourseDetailVO vo = new CrawledCourseDetailVO();
        vo.setId(cc.getId());
        vo.setSource(cc.getSource());
        vo.setSourceUrl(cc.getSourceUrl());
        vo.setSourceCourseId(cc.getSourceCourseId());
        vo.setTitle(cc.getTitle());
        vo.setType(normalizeCourseType(cc.getType()));
        vo.setTypeLabel(courseTypeLabel(cc.getType()));
        vo.setCategoryId(cc.getCategoryId());
        vo.setSubCategoryId(cc.getSubCategoryId());
        Map<Integer, String> categoryNames = courseCategoryNames(cc);
        vo.setCategoryName(categoryNames.get(cc.getCategoryId()));
        vo.setSubCategoryName(categoryNames.get(cc.getSubCategoryId()));
        vo.setCategoryNameRaw(cc.getCategoryNameRaw());
        vo.setCoverUrl(cc.getCoverUrl());
        vo.setIntro(cc.getIntro());
        vo.setSummary(cc.getSummary());
        vo.setSyllabus(cc.getSyllabus());
        vo.setAudience(cc.getAudience());
        vo.setHighlights(cc.getHighlights());
        vo.setDurationDays(cc.getDurationDays());
        vo.setTotalHours(cc.getTotalHours());
        vo.setPrice(cc.getPrice());
        Map<String, Object> rawJson = parseRawJson(cc);
        vo.setPriceRaw(rawJsonString(rawJson, "price_raw"));
        vo.setPriceParseStatus(rawJsonString(rawJson, "price_parse_status"));
        vo.setContentType(rawJsonString(rawJson, "content_type"));
        vo.setOriginalPrice(cc.getOriginalPrice());
        vo.setKeywords(cc.getKeywords());
        vo.setTrainerNameRaw(cc.getTrainerNameRaw());
        vo.setTargetAudience(cc.getTargetAudience());
        vo.setLearningOutcomes(cc.getLearningOutcomes());
        vo.setDedupStatus(cc.getDedupStatus());
        vo.setDedupStatusText(dedupStatusText(cc.getDedupStatus()));
        vo.setDedupCourseId(cc.getDedupCourseId());
        vo.setDedupTargetType(cc.getDedupTargetType());
        vo.setDedupTargetId(cc.getDedupTargetId());
        vo.setDedupMatchType(cc.getDedupMatchType());
        vo.setDedupScore(cc.getDedupScore());
        vo.setDedupCheckedAt(cc.getDedupCheckedAt());
        vo.setDedupReason(cc.getDedupReason());
        vo.setReviewStatus(cc.getReviewStatus());
        vo.setReviewStatusText(reviewStatusText(cc.getReviewStatus()));
        vo.setReviewRejectReason(cc.getReviewRejectReason());
        vo.setReviewedAt(cc.getReviewedAt());
        vo.setImportedCourseId(cc.getImportedCourseId());
        vo.setCreatedAt(cc.getCreatedAt());

        vo.setPlansList(toPlanItems(cc.getPlansJson()));
        vo.setServicesList(parseJson(cc.getServicesJson(), new TypeReference<>() {}));
        vo.setDiagnostics(rawJsonList(rawJson, "diagnostics"));
        vo.setRawJson(rawJson);

        return vo;
    }

    private boolean isExplicitFreePrice(CrawledCourse cc, BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) > 0) {
            return false;
        }
        Map<String, Object> rawJson = parseRawJson(cc);
        String status = rawJsonString(rawJson, "price_parse_status");
        if ("NEGOTIABLE".equalsIgnoreCase(status) || "MISSING".equalsIgnoreCase(status) || "INVALID".equalsIgnoreCase(status)) {
            return false;
        }
        if ("FREE".equalsIgnoreCase(status)) {
            return true;
        }
        if ("NUMERIC".equalsIgnoreCase(status)) {
            return true;
        }
        String raw = rawJsonString(rawJson, "price_raw");
        if (raw != null) {
            String normalized = raw.toLowerCase(Locale.ROOT);
            if (normalized.contains("面议") || normalized.contains("待商") || normalized.contains("咨询") || normalized.contains("洽谈")) {
                return false;
            }
            if (normalized.contains("免费") || normalized.matches(".*(^|[^0-9])0\\s*(元|rmb|￥)?.*")) {
                return true;
            }
        }
        return price.compareTo(BigDecimal.ZERO) <= 0;
    }

    private Map<String, Object> parseRawJson(CrawledCourse cc) {
        Map<String, Object> rawJson = parseJson(cc.getRawJson(), new TypeReference<>() {});
        return rawJson == null ? Collections.emptyMap() : rawJson;
    }

    private String rawJsonString(Map<String, Object> rawJson, String key) {
        if (rawJson == null) {
            return null;
        }
        Object value = rawJson.get(key);
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isBlank() ? null : text;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> rawJsonList(Map<String, Object> rawJson, String key) {
        if (rawJson == null) {
            return List.of();
        }
        Object value = rawJson.get(key);
        if (!(value instanceof List<?> rawList)) {
            return List.of();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : rawList) {
            if (item instanceof Map<?, ?> map) {
                Map<String, Object> normalized = new LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    if (entry.getKey() != null) {
                        normalized.put(entry.getKey().toString(), entry.getValue());
                    }
                }
                result.add(normalized);
            }
        }
        return result;
    }

    private List<CrawledCourseDetailVO.PlanItem> toPlanItems(String plansJson) {
        List<Map<String, Object>> rawPlans = parseJson(plansJson, new TypeReference<>() {});
        if (rawPlans == null || rawPlans.isEmpty()) {
            return List.of();
        }
        List<CrawledCourseDetailVO.PlanItem> items = new ArrayList<>();
        for (Map<String, Object> raw : rawPlans) {
            if (raw == null || raw.isEmpty()) {
                continue;
            }
            CrawledCourseDetailVO.PlanItem item = new CrawledCourseDetailVO.PlanItem();
            String start = mapString(raw, "start_time", "startTime", "start_date", "startDate", "date");
            String end = mapString(raw, "end_time", "endTime");
            String location = mapString(raw, "location", "city", "address");
            item.setStartTime(defaultText(start, ""));
            item.setEndTime(defaultText(end, ""));
            item.setStartDate(defaultText(mapString(raw, "start_date", "start_time", "startDate", "startTime", "date"), ""));
            item.setProvinceId(defaultInt(mapInteger(raw, "provinceId", "province_id")));
            item.setCityId(defaultInt(mapInteger(raw, "cityId", "city_id")));
            item.setDistrictId(defaultInt(mapInteger(raw, "districtId", "district_id")));
            item.setCity(defaultText(mapString(raw, "city"), defaultText(location, "")));
            item.setAddress(defaultText(mapString(raw, "address"), defaultText(location, "")));
            item.setOnlineUrl(defaultText(mapString(raw, "online_url", "onlineUrl", "url"), ""));
            items.add(item);
        }
        return items;
    }

    private CrawlJobVO toJobVO(CrawlJob job) {
        CrawlJobVO vo = new CrawlJobVO();
        vo.setId(job.getId());
        vo.setSource(job.getSource());
        vo.setDataType(job.getDataType());
        vo.setStatus(job.getStatus());
        vo.setStatusLabel(jobStatusText(job.getStatus()));
        vo.setCrawlerJobId(job.getCrawlerJobId());
        vo.setTotalCount(job.getTotalCount());
        vo.setProcessedCount(job.getProcessedCount());
        vo.setSuccessCount(job.getSuccessCount());
        vo.setDuplicateCount(job.getDuplicateCount());
        vo.setErrorCount(job.getErrorCount());
        vo.setErrorMessage(job.getErrorMessage());
        vo.setProgressMessage(job.getProgressMessage());
        vo.setStartedAt(job.getStartedAt());
        vo.setFinishedAt(job.getFinishedAt());
        vo.setTriggeredBy(job.getTriggeredBy());
        vo.setCreatedAt(job.getCreatedAt());
        return vo;
    }

    // ==================== 工具方法 ====================

    private String dedupStatusText(Integer status) {
        if (status == null) return "未检查";
        return switch (status) {
            case 0 -> "未检查";
            case 1 -> "无重复";
            case 2 -> "疑似重复";
            case 3 -> "确认重复";
            default -> "未知";
        };
    }

    private String reviewStatusText(Integer status) {
        if (status == null) return "待审核";
        return switch (status) {
            case 0 -> "待审核";
            case 1 -> "已通过";
            case 2 -> "已驳回";
            case 3 -> "已入库";
            default -> "未知";
        };
    }

    private String importBlockedMessage(Integer status) {
        if (Objects.equals(status, 2)) {
            return "已驳回课程不能直接导入，请先恢复为待审核";
        }
        if (Objects.equals(status, 3)) {
            return "已入库课程不能重复导入";
        }
        if (Objects.equals(status, 1)) {
            return "已通过课程不能通过该入口重复导入";
        }
        return "只有待审核课程可以导入";
    }

    private String updateBlockedMessage(Integer status) {
        if (Objects.equals(status, 2)) {
            return "已驳回课程不能直接保存审核修改，请先恢复为待审核";
        }
        if (Objects.equals(status, 3)) {
            return "已入库课程不能保存审核草稿，请到正式课程管理中修改";
        }
        if (Objects.equals(status, 1)) {
            return "已通过课程不能通过该入口保存审核草稿";
        }
        return "只有待审核课程可以保存审核修改";
    }

    private String jobStatusText(Integer status) {
        if (status == null) return "待执行";
        return switch (status) {
            case 0 -> "待执行";
            case 1 -> "运行中";
            case 2 -> "已完成";
            case 3 -> "失败";
            case 4 -> "已取消";
            default -> "未知";
        };
    }

    private String getString(Map<String, Object> item, String key) {
        Object val = item.get(key);
        return val != null ? val.toString() : null;
    }

    private Integer getInt(Map<String, Object> item, String key, Integer defaultVal) {
        Object val = item.get(key);
        if (val == null) return defaultVal;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }

    private BigDecimal getBigDecimal(Map<String, Object> item, String key, BigDecimal defaultVal) {
        Object val = item.get(key);
        if (val == null) return defaultVal;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        try {
            String text = val.toString().replace(",", "").replaceAll("[^0-9.]", "");
            return text.isBlank() ? defaultVal : new BigDecimal(text);
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try { return objectMapper.writeValueAsString(obj); } catch (Exception e) { return null; }
    }

    private <T> T parseJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.isBlank()) return null;
        try { return objectMapper.readValue(json, typeRef); } catch (Exception e) { return null; }
    }

    private String buildCrawlerUsername(String source, String sourceItemId, Integer crawledId) {
        String raw = "crawl_" + defaultText(source, "src") + "_" + defaultText(sourceItemId, String.valueOf(crawledId));
        raw = raw.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_]", "_").replaceAll("_+", "_");
        if (raw.length() < 4) {
            raw = "crawl_" + crawledId;
        }
        return raw.length() > 32 ? raw.substring(0, 32) : raw;
    }

    private void applyJobProgress(CrawlJob job, CrawlCallbackRequest request) {
        if (request.getTotal() != null) {
            job.setTotalCount(maxInt(job.getTotalCount(), request.getTotal()));
        }
        if (request.getProcessed() != null) {
            job.setProcessedCount(maxInt(job.getProcessedCount(), request.getProcessed()));
        }
        if (request.getSuccessCount() != null) {
            job.setSuccessCount(maxInt(job.getSuccessCount(), request.getSuccessCount()));
        }
        if (request.getDuplicateCount() != null) {
            job.setDuplicateCount(maxInt(job.getDuplicateCount(), request.getDuplicateCount()));
        }
        if (request.getErrorCount() != null) {
            job.setErrorCount(maxInt(job.getErrorCount(), request.getErrorCount()));
        }
        if (request.getMessage() != null && !request.getMessage().isBlank()) {
            job.setProgressMessage(request.getMessage().trim());
        }
    }

    private int defaultInt(Integer value) {
        return value == null ? 0 : value;
    }

    private int maxInt(Integer left, Integer right) {
        return Math.max(defaultInt(left), defaultInt(right));
    }

    private String defaultText(String value) {
        return defaultText(value, "暂无");
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String normalizeTrainerName(String value) {
        if (value == null) return null;
        String text = value.trim();
        if (text.isBlank() || "暂无".equals(text) || "-".equals(text)) {
            return null;
        }
        return text;
    }

    private String defaultJsonArray(String value) {
        if (value == null || value.isBlank() || "暂无".equals(value)) {
            return "[]";
        }
        return value;
    }

    private String limit(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private String mapString(Map<String, Object> raw, String... keys) {
        if (raw == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            Object value = raw.get(key);
            if (value != null) {
                String text = value.toString().trim();
                if (!text.isBlank()) {
                    return text;
                }
            }
        }
        return null;
    }

    private Integer mapInteger(Map<String, Object> raw, String... keys) {
        String text = mapString(raw, keys);
        if (text == null) {
            return null;
        }
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String text = value.trim().replace('T', ' ');
        for (String part : text.split("\\s+")) {
            try {
                return LocalDate.parse(part);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private record RegionMatch(Integer provinceId, Integer cityId, String cityName) {
        private static RegionMatch empty() {
            return new RegionMatch(0, 0, "");
        }

        private boolean isEmpty() {
            return cityId == null || cityId <= 0 || provinceId == null || provinceId <= 0;
        }
    }
}
