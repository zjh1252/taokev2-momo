package com.taoke.admin.service;

import com.taoke.admin.dto.crawl.*;
import com.taoke.admin.entity.CrawlSource;
import com.taoke.admin.entity.CrawledCourse;
import com.taoke.admin.entity.CrawledTrainer;
import com.taoke.admin.entity.CrawlJob;
import com.taoke.admin.repository.CrawledCourseRepository;
import com.taoke.admin.repository.CrawledTrainerRepository;
import com.taoke.admin.repository.CrawlJobRepository;
import com.taoke.admin.repository.CrawlSourceRepository;
import com.taoke.common.dto.PageResult;
import com.taoke.common.dto.RegionVO;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

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

    private final CrawledTrainerRepository crawledTrainerRepository;
    private final CrawledCourseRepository crawledCourseRepository;
    private final CrawlJobRepository crawlJobRepository;
    private final CrawlSourceRepository crawlSourceRepository;
    private final CrawlerClientService crawlerClientService;
    private final TrainerService trainerService;
    private final UserService userService;
    private final RoleApplyService roleApplyService;
    private final CourseService courseService;
    private final TrainerCaseService trainerCaseService;
    private final RegionService regionService;
    private final ObjectMapper objectMapper;

    @Value("${crawler.callback-token:}")
    private String callbackToken;

    // ==================== 数据源 ====================

    /**
     * 获取全部数据源配置（含禁用项，供后台管理）。
     */
    public List<CrawlSourceVO> listSources() {
        return crawlSourceRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(this::toSourceVO)
                .toList();
    }

    /**
     * 新增自定义数据源。
     */
    @Transactional
    public CrawlSourceVO createSource(SaveCrawlSourceRequest request) {
        String code = normalizeSourceCode(request.getCode());
        String dataType = request.getDataType().trim().toUpperCase();
        if (crawlSourceRepository.existsByCodeAndDataType(code, dataType)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该标识与数据类型组合已存在");
        }

        CrawlSource source = new CrawlSource();
        applySourceFields(source, request, code, dataType);
        source.setBuiltIn(false);
        if (source.getSortOrder() == null) {
            source.setSortOrder(nextSortOrder());
        }
        return toSourceVO(crawlSourceRepository.save(source));
    }

    /**
     * 更新数据源（内置项不可改 code / dataType）。
     */
    @Transactional
    public CrawlSourceVO updateSource(Integer id, SaveCrawlSourceRequest request) {
        CrawlSource source = crawlSourceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "数据源不存在"));

        String code = normalizeSourceCode(request.getCode());
        String dataType = request.getDataType().trim().toUpperCase();
        if (Boolean.TRUE.equals(source.getBuiltIn())) {
            if (!source.getCode().equals(code) || !source.getDataType().equals(dataType)) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "内置数据源不可修改标识与类型");
            }
        } else if (crawlSourceRepository.existsByCodeAndDataTypeAndIdNot(code, dataType, id)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该标识与数据类型组合已存在");
        }

        applySourceFields(source, request, code, dataType);
        return toSourceVO(crawlSourceRepository.save(source));
    }

    /**
     * 删除自定义数据源（内置种子不可删）。
     */
    @Transactional
    public void deleteSource(Integer id) {
        CrawlSource source = crawlSourceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "数据源不存在"));
        if (Boolean.TRUE.equals(source.getBuiltIn())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "内置数据源不可删除，可改为禁用");
        }
        crawlSourceRepository.delete(source);
    }

    private void applySourceFields(CrawlSource source, SaveCrawlSourceRequest request,
                                   String code, String dataType) {
        source.setCode(code);
        source.setName(request.getName().trim());
        source.setUrl(request.getUrl().trim());
        source.setDataType(dataType);
        if (request.getEnabled() != null) {
            source.setEnabled(request.getEnabled());
        } else if (source.getEnabled() == null) {
            source.setEnabled(true);
        }
        if (request.getSortOrder() != null) {
            source.setSortOrder(request.getSortOrder());
        }
        source.setRemark(trimToNull(request.getRemark()));
    }

    private String normalizeSourceCode(String code) {
        return code.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int nextSortOrder() {
        return crawlSourceRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(CrawlSource::getSortOrder)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 10;
    }

    private CrawlSourceVO toSourceVO(CrawlSource source) {
        CrawlSourceVO vo = new CrawlSourceVO();
        vo.setId(source.getId());
        vo.setCode(source.getCode());
        vo.setName(source.getName());
        vo.setUrl(source.getUrl());
        vo.setDataType(source.getDataType());
        vo.setEnabled(source.getEnabled());
        vo.setBuiltIn(source.getBuiltIn());
        vo.setSortOrder(source.getSortOrder());
        vo.setRemark(source.getRemark());
        vo.setStatus(Boolean.TRUE.equals(source.getEnabled()) ? "AVAILABLE" : "DISABLED");
        return vo;
    }

    private CrawlSource requireEnabledSource(String code, String dataType) {
        return crawlSourceRepository.findByCodeAndDataType(code, dataType)
                .filter(source -> Boolean.TRUE.equals(source.getEnabled()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "数据源不存在或未启用"));
    }

    // ==================== 爬虫任务 ====================

    /**
     * 触发爬取任务
     */
    public CrawlJobVO triggerJob(TriggerCrawlRequest request) {
        String sourceCode = request.getSource().trim().toLowerCase(Locale.ROOT);
        String dataType = request.getDataType().trim().toUpperCase(Locale.ROOT);
        requireEnabledSource(sourceCode, dataType);

        // 1. 调用 Python 爬虫服务创建任务
        String crawlerJobId = crawlerClientService.triggerCrawl(
                sourceCode, dataType, request.getMaxItems(), request.getStartUrl());

        // 2. 记录任务到数据库
        CrawlJob job = new CrawlJob();
        job.setSource(sourceCode);
        job.setDataType(dataType);
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

        page.getContent().forEach(this::syncRunningJobFromCrawler);

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
        try {
            crawlerClientService.cancelCrawl(job.getCrawlerJobId());
        } catch (Exception e) {
            log.warn("取消爬取任务失败（Python 爬虫服务可能未响应）: jobId={}, crawlerJobId={}, error={}",
                    id, job.getCrawlerJobId(), e.getMessage());
        }
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
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        if (cc.getReviewStatus() != 0) {
            throw new IllegalStateException("该记录已处理");
        }

        // 合并管理员编辑
        if (edits != null) {
            if (edits.getCategoryId() != null) cc.setCategoryId(edits.getCategoryId());
            if (edits.getSubCategoryId() != null) cc.setSubCategoryId(edits.getSubCategoryId());
            if (edits.getTitle() != null) cc.setTitle(edits.getTitle());
        }

        if (cc.getDedupStatus() != null && cc.getDedupStatus() >= 2
                && (edits == null || !edits.isForceImport())) {
            throw new IllegalStateException("该课程疑似重复，请确认后使用 forceImport 强制导入");
        }
        Trainer publisher = resolveCoursePublisher(cc, edits);

        SaveCourseRequest request = new SaveCourseRequest();
        request.setTitle(limit(defaultText(cc.getTitle()), 200));
        request.setType("INTERNAL");
        request.setCategoryId(edits.getCategoryId() != null ? edits.getCategoryId() : (cc.getCategoryId() != null ? cc.getCategoryId() : 0));
        request.setSubCategoryId(edits.getSubCategoryId() != null ? edits.getSubCategoryId() : (cc.getSubCategoryId() != null ? cc.getSubCategoryId() : 0));
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
        request.setIsFree(request.getPrice().compareTo(BigDecimal.ZERO) <= 0 ? 1 : 0);
        List<CoursePlanDTO> plans = toCoursePlans(cc.getPlansJson(), cc.getDurationDays(), cc.getType());
        request.setHasPlan(plans.isEmpty() ? 0 : 1);
        request.setType(plans.isEmpty() ? "INTERNAL" : normalizeCourseType(cc.getType()));
        request.setPlans(plans);

        CourseDetailVO course = courseService.create(publisher.getUserId(), BusinessRole.Code.TRAINER, request);

        // 更新中间表状态
        cc.setReviewStatus(3); // 已入库
        cc.setReviewedAt(LocalDateTime.now());
        cc.setImportedCourseId(course.getId());
        crawledCourseRepository.save(cc);

        log.info("导入爬取课程成功: crawledId={}, courseId={}, title={}", crawledId, course.getId(), cc.getTitle());
        return course.getId();
    }

    /**
     * 确定爬取课程入库时使用的正式专家。
     * <p>
     * 管理员可手动传入 trainerId；未传时按爬取讲师名自动匹配正式专家，匹配不到则自动创建一个外部导入专家。
     * </p>
     */
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
        if (!isOpenCourse(rawType)) {
            return List.of();
        }

        List<Map<String, Object>> rawPlans = parseJson(plansJson, new TypeReference<>() {});
        if (rawPlans == null || rawPlans.isEmpty()) {
            return List.of();
        }

        List<CoursePlanDTO> plans = new ArrayList<>();
        int sortOrder = 0;
        for (Map<String, Object> raw : rawPlans) {
            String startDate = mapString(raw, "start_date", "startDate", "date");
            LocalDate date = parseLocalDate(startDate);
            if (date == null) {
                continue;
            }

            String location = defaultText(mapString(raw, "location", "city", "address"), "");
            RegionMatch region = resolveRegion(location);
            if (region.cityId == 0) {
                continue;
            }

            CoursePlanDTO plan = new CoursePlanDTO();
            plan.setStartTime(LocalDateTime.of(date, LocalTime.of(9, 0)));
            int days = durationDays != null && durationDays > 0 ? durationDays : 1;
            plan.setEndTime(LocalDateTime.of(date.plusDays(days - 1L), LocalTime.of(18, 0)));
            plan.setProvinceId(region.provinceId);
            plan.setCityId(region.cityId);
            plan.setDistrictId(0);
            plan.setAddress(location.isBlank() ? region.cityName : location);
            plan.setSortOrder(sortOrder++);
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
        return switch (rawType.trim().toUpperCase(Locale.ROOT)) {
            case "OPEN_ONLINE", "OPEN_OFFLINE", "INTERNAL" -> rawType.trim().toUpperCase(Locale.ROOT);
            default -> "OPEN_OFFLINE";
        };
    }

    private RegionMatch resolveRegion(String rawLocation) {
        String location = defaultText(rawLocation, "").replace("市", "").trim();
        if (location.isBlank()) {
            return RegionMatch.empty();
        }

        List<RegionVO> matches = regionService.search(location, 2);
        if (matches == null || matches.isEmpty()) {
            return RegionMatch.empty();
        }

        RegionVO city = matches.stream()
                .filter(r -> location.contains(r.getName()) || r.getName().contains(location))
                .findFirst()
                .orElse(matches.get(0));
        if (city == null || city.getId() == null) {
            return RegionMatch.empty();
        }

        Integer provinceId = 0;
        if (city.getCode() != null) {
            try {
                var detail = regionService.getDetail(city.getCode());
                if (detail != null && detail.getPath() != null && !detail.getPath().isEmpty()) {
                    provinceId = detail.getPath().get(0).getId();
                }
            } catch (Exception ignored) {
            }
        }
        return new RegionMatch(provinceId != null ? provinceId : 0, city.getId(), city.getName());
    }

    /**
     * 驳回爬取课程
     */
    public void rejectCrawledCourse(Integer id, String reason) {
        CrawledCourse cc = crawledCourseRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("记录不存在"));
        if (cc.getReviewStatus() != 0) {
            throw new IllegalStateException("该记录已处理");
        }
        cc.setReviewStatus(2); // 已驳回
        cc.setReviewRejectReason(reason);
        cc.setReviewedAt(LocalDateTime.now());
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

    /**
     * 将仍显示运行中的任务与 Python 爬虫服务状态对齐（处理回调丢失等场景）
     */
    private void syncRunningJobFromCrawler(CrawlJob job) {
        if (job.getStatus() == null || job.getStatus() != 1) {
            return;
        }
        if (job.getCrawlerJobId() == null || job.getCrawlerJobId().isBlank()) {
            return;
        }
        try {
            Map<String, Object> remote = crawlerClientService.getStatus(job.getCrawlerJobId());
            String remoteStatus = String.valueOf(remote.get("status"));
            if ("failed".equals(remoteStatus)) {
                job.setStatus(3);
                Object err = remote.get("error");
                job.setErrorMessage(err != null ? err.toString() : "爬取失败");
                job.setProgressMessage("爬取失败");
                job.setFinishedAt(LocalDateTime.now());
                crawlJobRepository.save(job);
            } else if ("completed".equals(remoteStatus)) {
                job.setStatus(2);
                job.setProgressMessage("爬取完成");
                Object totalItems = remote.get("total_items");
                if (totalItems instanceof Number number) {
                    int count = number.intValue();
                    job.setProcessedCount(maxInt(job.getProcessedCount(), count));
                    job.setTotalCount(maxInt(job.getTotalCount(), count));
                }
                job.setFinishedAt(LocalDateTime.now());
                crawlJobRepository.save(job);
            }
        } catch (Exception e) {
            log.debug("同步爬虫任务状态跳过: jobId={}, reason={}", job.getId(), e.getMessage());
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
            updateCrawledCourseFields(cc, item);
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
        cc.setType(getString(item, "type") != null ? getString(item, "type") : "OPEN_OFFLINE");
        cc.setCategoryNameRaw(getString(item, "category_name_raw"));
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
        // source_url 已由唯一约束处理，这里做标题模糊匹配
        cc.setDedupStatus(1); // 默认无重复
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

    private CrawledCourseVO toCourseVO(CrawledCourse cc) {
        CrawledCourseVO vo = new CrawledCourseVO();
        vo.setId(cc.getId());
        vo.setSource(cc.getSource());
        vo.setSourceUrl(cc.getSourceUrl());
        vo.setTitle(cc.getTitle());
        vo.setType(cc.getType());
        vo.setCategoryNameRaw(cc.getCategoryNameRaw());
        vo.setCoverUrl(cc.getCoverUrl());
        vo.setPrice(cc.getPrice());
        vo.setDurationDays(cc.getDurationDays());
        vo.setTrainerNameRaw(cc.getTrainerNameRaw());
        vo.setDedupStatus(cc.getDedupStatus());
        vo.setDedupStatusText(dedupStatusText(cc.getDedupStatus()));
        vo.setDedupReason(cc.getDedupReason());
        vo.setReviewStatus(cc.getReviewStatus());
        vo.setReviewStatusText(reviewStatusText(cc.getReviewStatus()));
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
        vo.setType(cc.getType());
        vo.setCategoryId(cc.getCategoryId());
        vo.setSubCategoryId(cc.getSubCategoryId());
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
        vo.setOriginalPrice(cc.getOriginalPrice());
        vo.setKeywords(cc.getKeywords());
        vo.setTrainerNameRaw(cc.getTrainerNameRaw());
        vo.setTargetAudience(cc.getTargetAudience());
        vo.setLearningOutcomes(cc.getLearningOutcomes());
        vo.setDedupStatus(cc.getDedupStatus());
        vo.setDedupStatusText(dedupStatusText(cc.getDedupStatus()));
        vo.setDedupCourseId(cc.getDedupCourseId());
        vo.setDedupReason(cc.getDedupReason());
        vo.setReviewStatus(cc.getReviewStatus());
        vo.setReviewStatusText(reviewStatusText(cc.getReviewStatus()));
        vo.setReviewRejectReason(cc.getReviewRejectReason());
        vo.setReviewedAt(cc.getReviewedAt());
        vo.setImportedCourseId(cc.getImportedCourseId());
        vo.setCreatedAt(cc.getCreatedAt());

        vo.setPlansList(toPlanItems(cc.getPlansJson()));
        vo.setServicesList(parseJson(cc.getServicesJson(), new TypeReference<>() {}));
        vo.setRawJson(parseJson(cc.getRawJson(), new TypeReference<>() {}));

        return vo;
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
            item.setCity(defaultText(mapString(raw, "city"), defaultText(location, "")));
            item.setAddress(defaultText(mapString(raw, "address"), defaultText(location, "")));
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

    private LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String text = value.trim();
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
    }
}
