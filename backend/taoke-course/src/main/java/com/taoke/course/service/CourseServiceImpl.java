package com.taoke.course.service;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.entity.Category;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.*;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.course.util.CourseOnlineUrlValidator;
import com.taoke.course.mapper.CourseMapper;
import com.taoke.course.repository.CourseListCoreProjection;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.support.LegacyTaokeCourseReader;
import com.taoke.course.support.OpenCourseExpireSupport;
import com.taoke.course.support.PublicCourseListCache;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 课程管理服务 — CRUD + 状态流转 + 业务规则校验
 * <p>
 * 开课计划采用整体替换策略（先删后插），与课程保存在同一事务中。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CoursePlanRepository coursePlanRepository;
    private final CourseMapper courseMapper;
    private final CategoryService categoryService;
    private final CategoryRepository categoryRepository;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final RegionService regionService;
    private final LegacyTaokeCourseReader legacyTaokeCourseReader;
    private final BindingAuthority bindingAuthority;
    private final OpsMaterialResolver opsMaterialResolver;
    private final PublicCourseListCache publicCourseListCache;

    @PersistenceContext
    private EntityManager entityManager;

    // ==================== C 端发布者操作 ====================

    @Transactional
    @Override
    public CourseDetailVO create(Integer publisherId, String publisherType, SaveCourseRequest request) {
        boolean draft = Boolean.TRUE.equals(request.getDraft());
        CourseType type = resolveCourseType(request);
        validatePublisherType(publisherType, type);
        validateCoverRequired(request);
        if (!draft) {
            validateForSubmit(request);
            validatePlans(type, request.getPlans());
        }

        Course course = new Course();
        applyRequest(course, request, type);
        course.setPublisherId(publisherId);
        course.setPublisherType(publisherType);
        // draft=true 时存为草稿，可在「管理课程-草稿」中继续编辑；否则创建即进入待审核
        course.setStatus(draft ? CourseStatus.DRAFT.getValue() : CourseStatus.PENDING.getValue());

        // 专家发布时自动绑定 trainerId
        if (BusinessRole.Code.TRAINER.equals(publisherType)) {
            bindTrainerId(course, publisherId);
        }

        course = courseRepository.save(course);
        savePlans(course.getId(), type, request.getPlans());
        syncOpenEndDateFromPlans(course.getId(), type);

        return assembleDetail(course);
    }

    @Transactional
    @Override
    public CourseDetailVO update(Integer courseId, Integer publisherId, SaveCourseRequest request) {
        Course course = getOwnedCourse(courseId, publisherId);
        assertEditable(course);

        boolean draft = Boolean.TRUE.equals(request.getDraft());
        if (draft && course.getStatus() != CourseStatus.DRAFT.getValue()
                && course.getStatus() != CourseStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的课程可保存为草稿");
        }

        CourseType type = resolveCourseType(request);
        validatePublisherType(course.getPublisherType(), type);
        validateCoverRequired(request);
        if (!draft) {
            validateForSubmit(request);
            validatePlans(type, request.getPlans());
        }

        applyRequest(course, request, type);
        // draft=true 时保持草稿；否则编辑后统一回到待审核（保存即提交）
        course.setStatus(draft ? CourseStatus.DRAFT.getValue() : CourseStatus.PENDING.getValue());
        course = courseRepository.save(course);

        // 整体替换开课计划
        coursePlanRepository.deleteByCourseId(courseId);
        savePlans(courseId, type, request.getPlans());
        syncOpenEndDateFromPlans(courseId, type);

        return assembleDetail(course);
    }

    @Transactional
    @Override
    public void submitForReview(Integer courseId, Integer publisherId) {
        Course course = getOwnedCourse(courseId, publisherId);
        if (course.getCoverUrl() == null || course.getCoverUrl().isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请上传课程封面");
        }
        int status = course.getStatus();
        if (status != CourseStatus.DRAFT.getValue() && status != CourseStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的课程可提交审核");
        }
        // 草稿可能缺少必填内容，提交审核前做完整性校验
        if (isBlankHtml(course.getIntro())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请先完善课程介绍后再提交审核");
        }
        if (course.getType() != null && course.getType().isOpen()
                && coursePlanRepository.findByCourseIdOrderBySortOrder(courseId).isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "公开课必须添加至少一条开课计划后才能提交审核");
        }
        course.setStatus(CourseStatus.PENDING.getValue());
        courseRepository.save(course);
    }

    @Transactional
    @Override
    public void unpublish(Integer courseId, Integer publisherId) {
        Course course = getOwnedCourse(courseId, publisherId);
        if (course.getStatus() != CourseStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅已上架的课程可下架");
        }
        course.setStatus(CourseStatus.UNPUBLISHED.getValue());
        courseRepository.save(course);
        publicCourseListCache.evictPublicListCaches();
    }

    @Transactional
    @Override
    public void delete(Integer courseId, Integer publisherId) {
        Course course = getOwnedCourse(courseId, publisherId);
        int status = course.getStatus();
        if (status != CourseStatus.DRAFT.getValue() && status != CourseStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的课程可删除");
        }
        coursePlanRepository.deleteByCourseId(courseId);
        courseRepository.delete(course);
    }

    @Override
    public CourseDetailVO getDetailForPublisher(Integer courseId, Integer publisherId) {
        Course course = getOwnedCourse(courseId, publisherId);
        return assembleDetail(course);
    }

    @Override
    public PageResponse<CourseListItemVO> listByPublisher(Integer publisherId, String publisherType,
                                                           Integer status, String keyword,
                                                           int page, int size) {
        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("publisherId"), publisherId));
            predicates.add(cb.equal(root.get("publisherType"), publisherType));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), like),
                        cb.like(root.get("keywords"), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Course> coursePage = courseRepository.findAll(spec, pageable);

        if (coursePage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<Course> content = coursePage.getContent();
        List<CourseListItemVO> items = content.stream()
                .map(this::toListItemVO)
                .toList();

        // 公开课回填最近一场开课时间 / 开课地点（内训课、在线课无计划则留空）
        List<Integer> openCourseIds = content.stream()
                .filter(c -> c.getType() != null && c.getType().isOpen())
                .map(Course::getId)
                .toList();
        if (!openCourseIds.isEmpty()) {
            Map<Integer, CoursePlan> nearestPlanMap = pickDisplayPlansForOpenCourses(
                    openCourseIds, null, null);
            Set<Integer> regionIds = new HashSet<>();
            for (CoursePlan p : nearestPlanMap.values()) {
                if (p.getProvinceId() != null && p.getProvinceId() > 0) regionIds.add(p.getProvinceId());
                if (p.getCityId() != null && p.getCityId() > 0) regionIds.add(p.getCityId());
            }
            Map<Integer, String> regionNameMap = regionIds.isEmpty()
                    ? Map.of()
                    : regionService.getNamesByIds(regionIds);
            Map<Integer, CourseListItemVO> voById = items.stream()
                    .collect(Collectors.toMap(CourseListItemVO::getId, v -> v, (a, b) -> a));
            for (Map.Entry<Integer, CoursePlan> e : nearestPlanMap.entrySet()) {
                CourseListItemVO vo = voById.get(e.getKey());
                if (vo != null) {
                    vo.setNextPlanStartDate(e.getValue().getStartTime());
                    vo.setNextPlanCity(formatPlanLocation(e.getValue(), regionNameMap));
                    vo.setSeoPathId(resolveSeoPathId(e.getKey(), e.getValue()));
                }
            }
        }
        return PageResponse.of(items, coursePage.getTotalElements(), page, size);
    }

    // ==================== 公开接口 ====================

    @Override
    public CourseDetailVO getPublicDetail(Integer pathId) {
        // 先按 courses.id；未命中再按 course_plans.sort_order（老站 tk_course.id）
        Course course = courseRepository.findById(pathId)
                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED.getValue())
                .orElse(null);
        if (course == null) {
            course = coursePlanRepository.findFirstBySortOrderOrderByIdAsc(pathId)
                    .map(CoursePlan::getCourseId)
                    .flatMap(courseRepository::findById)
                    .filter(c -> c.getStatus() == CourseStatus.PUBLISHED.getValue())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        }
        return assembleDetail(course);
    }

    @Transactional
    @Override
    public void incrementViewCount(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        if (course.getStatus() != CourseStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "课程不存在");
        }
        course.setViewCount((course.getViewCount() != null ? course.getViewCount() : 0) + 1);
        courseRepository.save(course);
    }

    @Override
    public PageResponse<CourseListItemVO> listPublic(PublicCourseQuery query) {
        final int page = Math.max(1, query.getPage());
        final int size = query.getSize() <= 0 ? 15 : query.getSize();

        boolean cacheableDefault = publicCourseListCache.isCacheableDefault(query);
        if (cacheableDefault) {
            PageResponse<CourseListItemVO> cached = publicCourseListCache.getDefaultList(query);
            if (cached != null) {
                return cached;
            }
        }

        // 机构筛选：先按 institutionId 反查 userId，作为 publisherType=INSTITUTION 的 publisherId
        final Integer institutionUserId;
        if (query.getInstitutionId() != null) {
            List<Institution> insts = institutionService.findByIds(List.of(query.getInstitutionId()));
            if (insts.isEmpty()) {
                return PageResponse.of(List.of(), 0, page, size);
            }
            institutionUserId = insts.get(0).getUserId();
        } else {
            institutionUserId = null;
        }

        // 解析时间快捷段
        LocalDate startFrom = query.getStartTimeFrom();
        LocalDate startTo = query.getStartTimeTo();
        if (query.getTimeQuick() != null && !query.getTimeQuick().isBlank()) {
            LocalDate[] range = resolveTimeQuickRange(query.getTimeQuick());
            if (range != null) {
                startFrom = startFrom != null ? startFrom : range[0];
                startTo = startTo != null ? startTo : range[1];
            }
        }

        // 计划维度（开课省/市、开课时间、报名状态）—— 先一次性预查命中的 courseId 集合
        Set<Integer> planMatchedCourseIds = null;
        boolean hasProvince = query.getProvinceIds() != null && !query.getProvinceIds().isEmpty();
        boolean hasCity = query.getCityIds() != null && !query.getCityIds().isEmpty();
        boolean needPlanFilter = hasProvince
                || hasCity
                || startFrom != null
                || startTo != null
                || (query.getEnrollStatus() != null && !query.getEnrollStatus().isBlank());
        if (needPlanFilter) {
            planMatchedCourseIds = findCourseIdsByPlanFilter(
                    query.getProvinceIds(),
                    query.getCityIds(),
                    startFrom,
                    startTo,
                    query.getEnrollStatus());
            if (planMatchedCourseIds.isEmpty()) {
                return PageResponse.of(List.of(), 0, page, size);
            }
        }

        final Set<Integer> planIdsFinal = planMatchedCourseIds;

        // 内训课：按主讲专家维度预筛 trainerId
        Set<Integer> trainerMatchedIds = null;
        boolean needTrainerFilter = query.getTrainerIndustryCategoryId() != null
                || query.getTrainerProvinceId() != null
                || query.getTrainerCityId() != null
                || (query.getTrainerIsTrusted() != null && query.getTrainerIsTrusted() == 1)
                || (query.getTrainerHasCopyright() != null && query.getTrainerHasCopyright() == 1);
        if (needTrainerFilter) {
            List<Integer> ids = trainerService.findPublishedTrainerIds(
                    query.getTrainerIndustryCategoryId(),
                    query.getTrainerProvinceId(),
                    query.getTrainerCityId(),
                    query.getTrainerIsTrusted(),
                    query.getTrainerHasCopyright());
            if (ids.isEmpty()) {
                return PageResponse.of(List.of(), 0, page, size);
            }
            trainerMatchedIds = new HashSet<>(ids);
        }

        final Set<Integer> trainerIdsFinal = trainerMatchedIds;
        Set<Integer> expandedCategoryIds = resolveExpandedCourseCategoryIds(query);
        // 纯内训列表无需公开课到期隐藏谓词（OR 条件干扰优化器）
        final boolean internalOnly = Boolean.FALSE.equals(query.getIsOpen())
                || CourseType.INTERNAL.name().equals(query.getType());

        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()));
            if (!internalOnly) {
                predicates.add(OpenCourseExpireSupport.publicVisiblePredicate(root, cb, LocalDate.now()));
            }

            if (!expandedCategoryIds.isEmpty()) {
                predicates.add(cb.or(
                        root.get("categoryId").in(expandedCategoryIds),
                        root.get("subCategoryId").in(expandedCategoryIds)
                ));
            } else {
                if (query.getCategoryIds() != null && !query.getCategoryIds().isEmpty()) {
                    predicates.add(root.get("categoryId").in(query.getCategoryIds()));
                }
                if (query.getSubCategoryIds() != null && !query.getSubCategoryIds().isEmpty()) {
                    predicates.add(root.get("subCategoryId").in(query.getSubCategoryIds()));
                }
            }
            if (query.getType() != null && !query.getType().isBlank()) {
                predicates.add(cb.equal(root.get("type"), CourseType.valueOf(query.getType())));
            } else if (query.getIsOpen() != null) {
                if (query.getIsOpen()) {
                    predicates.add(root.get("type").in(CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE));
                } else {
                    predicates.add(cb.equal(root.get("type"), CourseType.INTERNAL));
                }
            }
            if (query.getKeyword() != null && !query.getKeyword().isBlank()) {
                String like = "%" + query.getKeyword().trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), like),
                        cb.like(root.get("keywords"), like)
                ));
            }
            if (institutionUserId != null) {
                predicates.add(cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION));
                predicates.add(cb.equal(root.get("publisherId"), institutionUserId));
            }
            // 价格维度
            if (query.getIsFree() != null && query.getIsFree() == 1) {
                predicates.add(cb.equal(root.get("isFree"), 1));
            }
            if (query.getPriceMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), query.getPriceMin()));
            }
            if (query.getPriceMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), query.getPriceMax()));
            }
            if (query.getMinScore() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("score"),
                        java.math.BigDecimal.valueOf(query.getMinScore())));
            }
            // 计划维度命中集合
            if (planIdsFinal != null) {
                predicates.add(root.get("id").in(planIdsFinal));
            }
            // 主讲专家维度
            if (trainerIdsFinal != null) {
                predicates.add(root.get("trainerId").in(trainerIdsFinal));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Sort sort = resolvePublicSort(query.getSortBy());
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        List<Course> courses;
        long total;
        // 仅公开课「开课时间」走计划维排序；其余走三段式（ID 分页 → 轻量回表 → 装配）
        if (isPlanStartTimeSort(query.getSortBy(), query.getIsOpen())) {
            Page<Course> coursePage = findCoursesSortedByDisplayPlanStart(
                    spec,
                    "time_asc".equals(query.getSortBy()) ? Sort.Direction.ASC : Sort.Direction.DESC,
                    PageRequest.of(page - 1, size));
            if (coursePage.isEmpty()) {
                return PageResponse.of(List.of(), 0, page, size);
            }
            courses = coursePage.getContent();
            total = coursePage.getTotalElements();
        } else {
            total = countCoursesBySpec(spec);
            if (total == 0) {
                return PageResponse.of(List.of(), 0, page, size);
            }
            List<Integer> pageIds = findCourseIdsBySpec(spec, pageable);
            if (pageIds.isEmpty()) {
                return PageResponse.of(List.of(), total, page, size);
            }
            Map<Integer, Course> byId = courseRepository.findListCoreByIdIn(pageIds).stream()
                    .map(this::toCourseShell)
                    .collect(Collectors.toMap(Course::getId, c -> c, (a, b) -> a));
            courses = pageIds.stream().map(byId::get).filter(Objects::nonNull).toList();
        }

        List<CourseListItemVO> items = assembleListItems(
                courses,
                hasProvince ? query.getProvinceIds() : null,
                hasCity ? query.getCityIds() : null);
        PageResponse<CourseListItemVO> response = PageResponse.of(items, total, page, size);
        if (cacheableDefault) {
            publicCourseListCache.putDefaultList(query, response);
        }
        return response;
    }

    @Override
    public Map<Integer, Long> countPublicByCategoryL1(boolean isOpen, List<Integer> cityIds) {
        boolean cacheable = cityIds == null || cityIds.isEmpty();
        if (cacheable) {
            Map<Integer, Long> cached = publicCourseListCache.getCategoryL1Counts(isOpen);
            if (cached != null) {
                return cached;
            }
        }
        List<Object[]> rows;
        if (isOpen && cityIds != null && !cityIds.isEmpty()) {
            rows = courseRepository.countPublishedOpenByCategoryL1AndCityIds(cityIds);
        } else {
            rows = courseRepository.countPublishedByCategoryL1(isOpen ? 1 : 0);
        }
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] == null) {
                continue;
            }
            long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            map.put(((Number) row[0]).intValue(), count);
        }
        if (cacheable) {
            publicCourseListCache.putCategoryL1Counts(isOpen, map);
        }
        return map;
    }

    /**
     * 将时间快捷段标识转换为日期区间。
     *
     * @param key thisWeek / thisMonth / nextThreeMonths
     * @return 长度为 2 的数组 [from, to]，未识别返回 null
     */
    private LocalDate[] resolveTimeQuickRange(String key) {
        LocalDate today = LocalDate.now();
        return switch (key) {
            case "thisWeek" -> new LocalDate[]{today, today.with(TemporalAdjusters.next(java.time.DayOfWeek.SUNDAY))};
            case "thisMonth" -> new LocalDate[]{today, today.with(TemporalAdjusters.lastDayOfMonth())};
            case "nextThreeMonths" -> new LocalDate[]{today, today.plusMonths(3)};
            default -> null;
        };
    }

    /**
     * 按开课计划维度（省、市、时间区间、报名状态）筛选出命中的课程 ID 集合。
     * <p>方便上层 Specification 用 {@code course.id IN (...)} 拼接。</p>
     *
     * @param provinceIds 省份 ID 集合（OR 关系，传 null/empty 表示不过滤）
     * @param cityIds     城市 ID 集合（OR 关系，传 null/empty 表示不过滤）
     */
    private Set<Integer> findCourseIdsByPlanFilter(List<Integer> provinceIds, List<Integer> cityIds,
                                                    LocalDate startFrom, LocalDate startTo,
                                                    String enrollStatus) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fromTs = startFrom != null ? startFrom.atStartOfDay() : null;
        LocalDateTime toTs = startTo != null ? startTo.atTime(LocalTime.MAX) : null;

        // 仅投影 DISTINCT courseId，禁止 findAll 整行实体（城市频道无 ENROLLING 时历史计划量极大）
        Set<Integer> matched = findDistinctCourseIdsByPlanFilter(
                provinceIds, cityIds, fromTs, toTs, enrollStatus, now);

        // ENDED 还需排除「任意一条计划仍属未来」的课程（同样只投影 ID）
        if ("ENDED".equalsIgnoreCase(enrollStatus) && !matched.isEmpty()) {
            Set<Integer> withFuture = findDistinctCourseIdsByPlanFilter(
                    null, null, now, null, null, now, matched);
            matched.removeAll(withFuture);
        }

        return matched;
    }

    /**
     * 按开课计划条件投影去重 courseId（不加载 CoursePlan 实体）。
     */
    private Set<Integer> findDistinctCourseIdsByPlanFilter(
            List<Integer> provinceIds,
            List<Integer> cityIds,
            LocalDateTime fromTs,
            LocalDateTime toTs,
            String enrollStatus,
            LocalDateTime now) {
        return findDistinctCourseIdsByPlanFilter(
                provinceIds, cityIds, fromTs, toTs, enrollStatus, now, null);
    }

    private Set<Integer> findDistinctCourseIdsByPlanFilter(
            List<Integer> provinceIds,
            List<Integer> cityIds,
            LocalDateTime fromTs,
            LocalDateTime toTs,
            String enrollStatus,
            LocalDateTime now,
            Set<Integer> restrictCourseIds) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Integer> cq = cb.createQuery(Integer.class);
        Root<CoursePlan> root = cq.from(CoursePlan.class);
        List<Predicate> ps = new ArrayList<>();
        if (provinceIds != null && !provinceIds.isEmpty()) {
            ps.add(root.get("provinceId").in(provinceIds));
        }
        if (cityIds != null && !cityIds.isEmpty()) {
            ps.add(root.get("cityId").in(cityIds));
        }
        if (fromTs != null) {
            ps.add(cb.greaterThanOrEqualTo(root.get("startTime"), fromTs));
        }
        if (toTs != null) {
            ps.add(cb.lessThanOrEqualTo(root.get("startTime"), toTs));
        }
        if ("ENROLLING".equalsIgnoreCase(enrollStatus)) {
            ps.add(cb.greaterThanOrEqualTo(root.get("startTime"), now));
        }
        if ("ENDED".equalsIgnoreCase(enrollStatus)) {
            ps.add(cb.lessThan(root.get("startTime"), now));
        }
        if (restrictCourseIds != null && !restrictCourseIds.isEmpty()) {
            ps.add(root.get("courseId").in(restrictCourseIds));
        }
        cq.select(root.get("courseId")).distinct(true);
        if (!ps.isEmpty()) {
            cq.where(ps.toArray(Predicate[]::new));
        }
        return new LinkedHashSet<>(entityManager.createQuery(cq).getResultList());
    }

    /**
     * 批量装配课程列表项 VO，统一回填分类名/讲师名/最近一场开课信息（公开课用）。
     *
     * @param courses 课程实体列表
     * @return 列表项 VO 集合，顺序与入参一致
     */
    @Override
    public List<CourseListItemVO> assembleListItems(List<Course> courses) {
        return assembleListItems(courses, null, null);
    }

    @Override
    public List<CourseListItemVO> assembleListItems(List<Course> courses,
                                                    List<Integer> displayPlanProvinceIds,
                                                    List<Integer> displayPlanCityIds) {
        if (courses == null || courses.isEmpty()) {
            return List.of();
        }

        // 批量分类名
        Set<Integer> catIds = courses.stream()
                .map(Course::getCategoryId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, String> catNameMap = catIds.isEmpty()
                ? Map.of()
                : categoryService.getNameMap(catIds);

        // 批量讲师名
        Set<Integer> trainerIds = courses.stream()
                .map(Course::getTrainerId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, Trainer> trainerMap = trainerIds.isEmpty()
                ? Map.of()
                : trainerService.findByIds(trainerIds).stream()
                    .collect(Collectors.toMap(Trainer::getId, t -> t));

        Map<Integer, String> trainerAvatarMap = trainerMap.isEmpty()
                ? Map.of()
                : trainerService.resolveDisplayAvatars(trainerMap.keySet());

        // 批量专家驻地（省/市名称）— 汇总所有可能关联到的专家后再统一查地名
        Set<Integer> trainerRegionIds = new HashSet<>();

        // 批量最近一场公开课计划（仅公开课需要）
        List<Integer> openCourseIds = courses.stream()
                .filter(c -> c.getType() != null && c.getType().isOpen())
                .map(Course::getId)
                .toList();
        Map<Integer, CoursePlan> nearestPlanMap = pickDisplayPlansForOpenCourses(
                openCourseIds, displayPlanProvinceIds, displayPlanCityIds);

        // 批量省/市名称
        Set<Integer> regionIds = new HashSet<>();
        for (CoursePlan p : nearestPlanMap.values()) {
            if (p.getProvinceId() != null && p.getProvinceId() > 0) {
                regionIds.add(p.getProvinceId());
            }
            if (p.getCityId() != null && p.getCityId() > 0) {
                regionIds.add(p.getCityId());
            }
        }
        Map<Integer, String> regionNameMap = regionIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(regionIds);

        List<Integer> courseIds = courses.stream().map(Course::getId).toList();
        // 老库列表补全合并为 1 次主查询 + 1 次封面（不可用时进程内缓存跳过，避免串行打空库）
        LegacyTaokeCourseReader.ListEnrichment legacy = legacyTaokeCourseReader.loadListEnrichment(courseIds);
        Map<Integer, String> legacyLecturerMap = legacy.lecturerNames();
        Map<Integer, Integer> legacyLecturerUserIds = legacy.lecturerUserIds();
        Map<Integer, String> legacyKeywordsMap = legacy.keywords();
        Map<Integer, String> legacyCategoryMap = legacy.categoryNames();
        Map<Integer, Integer> legacyOrganizerUserIds = legacy.organizerUserIds();
        Map<Integer, String> legacyOrganizerFromLecturer = legacy.organizerNamesFromLecturer();
        Map<Integer, String> legacyCoverMap = legacyTaokeCourseReader.findCoverUrlsByCourseIds(courseIds);

        // trainer_id 缺失或无效时，按老库 lecturerid → user_trainers 补全主讲专家档案
        Set<Integer> legacyTrainerUserIds = new HashSet<>();
        for (Course course : courses) {
            if (resolveLinkedTrainer(course, trainerMap, Map.of(), Map.of()) != null) {
                continue;
            }
            Integer legacyUserId = legacyLecturerUserIds.get(course.getId());
            if (legacyUserId != null && legacyUserId > 0) {
                legacyTrainerUserIds.add(legacyUserId);
            }
        }
        Map<Integer, Trainer> trainerByUserId = legacyTrainerUserIds.isEmpty()
                ? Map.of()
                : trainerService.findByUserIds(legacyTrainerUserIds.stream().toList()).stream()
                    .collect(Collectors.toMap(Trainer::getUserId, t -> t, (a, b) -> a));

        Set<String> lecturerNamesForLookup = new HashSet<>();
        for (Course course : courses) {
            if (resolveLinkedTrainer(course, trainerMap, trainerByUserId, legacyLecturerUserIds) != null) {
                continue;
            }
            String legacyLecturer = legacyLecturerMap.get(course.getId());
            if (legacyLecturer != null && !legacyLecturer.isBlank()) {
                lecturerNamesForLookup.add(legacyLecturer.trim());
                String normalized = normalizeTrainerLookupName(legacyLecturer);
                if (!normalized.isBlank()) {
                    lecturerNamesForLookup.add(normalized);
                }
            }
        }
        Map<String, Trainer> trainerByName = buildTrainerByNameMap(lecturerNamesForLookup);

        collectTrainerRegionIds(trainerMap.values(), trainerRegionIds);
        collectTrainerRegionIds(trainerByUserId.values(), trainerRegionIds);
        collectTrainerRegionIds(trainerByName.values(), trainerRegionIds);
        final Map<Integer, String> trainerRegionNameMap = trainerRegionIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(trainerRegionIds);

        Set<Integer> institutionLookupUserIds = new HashSet<>();
        courses.stream()
                .filter(c -> BusinessRole.Code.INSTITUTION.equals(c.getPublisherType()))
                .map(Course::getPublisherId)
                .filter(id -> id != null && id > 0)
                .forEach(institutionLookupUserIds::add);
        legacyOrganizerUserIds.values().stream()
                .filter(id -> id != null && id > 0)
                .forEach(institutionLookupUserIds::add);
        Map<Integer, Institution> institutionByUserId = institutionLookupUserIds.isEmpty()
                ? Map.of()
                : institutionService.findByUserIds(institutionLookupUserIds.stream().toList()).stream()
                    .collect(Collectors.toMap(Institution::getUserId, i -> i, (a, b) -> a));
        Map<Integer, String> legacyMemberNameMap = legacyOrganizerUserIds.isEmpty()
                ? Map.of()
                : legacyTaokeCourseReader.findMemberDisplayNames(legacyOrganizerUserIds.values());

        return courses.stream().map(c -> {
            CourseListItemVO vo = courseMapper.toListItemVO(c);
            vo.setTypeLabel(c.getType().getLabel());
            vo.setStatusLabel(CourseStatus.of(c.getStatus()).getLabel());
            if (c.getCategoryId() != null && c.getCategoryId() > 0) {
                vo.setCategoryName(catNameMap.get(c.getCategoryId()));
            }
            if (vo.getCategoryName() == null || vo.getCategoryName().isBlank()) {
                String legacyCat = legacyCategoryMap.get(c.getId());
                if (legacyCat != null && !legacyCat.isBlank()) {
                    vo.setCategoryName(legacyCat);
                }
            }
            Trainer trainer = resolveLinkedTrainer(c, trainerMap, trainerByUserId, legacyLecturerUserIds);
            if (trainer == null) {
                String legacyLecturer = legacyLecturerMap.get(c.getId());
                if (legacyLecturer != null && !legacyLecturer.isBlank()) {
                    trainer = trainerByName.get(legacyLecturer.trim());
                    if (trainer == null) {
                        trainer = trainerByName.get(normalizeTrainerLookupName(legacyLecturer));
                    }
                }
            }
            final String categoryNameForCover = vo.getCategoryName();
            final String coverUrlForDisplay = firstNonBlank(c.getCoverUrl(), legacyCoverMap.get(c.getId()));
            if (trainer != null) {
                applyTrainerToListItem(vo, trainer, trainerRegionNameMap);
                String trainerAvatar = trainerAvatarMap.getOrDefault(trainer.getId(), trainer.getAvatar());
                vo.setCoverUrl(resolveCoverUrl(c, coverUrlForDisplay, trainerAvatar, categoryNameForCover));
            } else {
                vo.setCoverUrl(resolveCoverUrl(c, coverUrlForDisplay, null, categoryNameForCover));
                String legacyLecturer = legacyLecturerMap.get(c.getId());
                if (legacyLecturer != null && !legacyLecturer.isBlank()) {
                    vo.setTrainerName(legacyLecturer);
                } else if (BusinessRole.Code.INSTITUTION.equals(c.getPublisherType())) {
                    Institution inst = institutionByUserId.get(c.getPublisherId());
                    if (inst != null && inst.getOrgName() != null && !inst.getOrgName().isBlank()) {
                        vo.setTrainerName(inst.getOrgName());
                    }
                }
            }
            if (vo.getKeywords() == null || vo.getKeywords().isBlank()) {
                String legacyKeywords = legacyKeywordsMap.get(c.getId());
                if (legacyKeywords != null && !legacyKeywords.isBlank()) {
                    vo.setKeywords(legacyKeywords);
                }
            }
            CoursePlan nearest = nearestPlanMap.get(c.getId());
            if (nearest != null) {
                vo.setNextPlanStartDate(nearest.getStartTime());
                vo.setNextPlanCity(formatPlanLocation(nearest, regionNameMap));
                vo.setSeoPathId(resolveSeoPathId(c.getId(), nearest));
            } else if (c.getType() != null && c.getType().isOpen()) {
                vo.setSeoPathId(c.getId());
            }
            String organizerName = resolveOrganizerName(
                    c, institutionByUserId, legacyOrganizerUserIds, legacyOrganizerFromLecturer, legacyMemberNameMap);
            if (organizerName != null) {
                vo.setPublisherName(organizerName);
            }
            vo.setDurationDays(normalizeDisplayDurationDays(c.getDurationDays(), c.getTotalHours()));
            vo.setIsOverdue(OpenCourseExpireSupport.isOverdue(c));
            return vo;
        }).toList();
    }

    /** 解析列表项关联的专家：courses.trainer_id 优先，其次老库 lecturerid。 */
    private Trainer resolveLinkedTrainer(Course course,
                                         Map<Integer, Trainer> trainerMap,
                                         Map<Integer, Trainer> trainerByUserId,
                                         Map<Integer, Integer> legacyLecturerUserIds) {
        if (course == null) {
            return null;
        }
        Integer trainerId = course.getTrainerId();
        if (trainerId != null && trainerId > 0) {
            Trainer trainer = trainerMap.get(trainerId);
            if (trainer != null) {
                return trainer;
            }
        }
        Integer legacyUserId = legacyLecturerUserIds.get(course.getId());
        if (legacyUserId != null && legacyUserId > 0) {
            return trainerByUserId.get(legacyUserId);
        }
        return null;
    }

    private void applyTrainerToListItem(CourseListItemVO vo,
                                        Trainer trainer,
                                        Map<Integer, String> trainerRegionNameMap) {
        if (vo == null || trainer == null) {
            return;
        }
        vo.setTrainerId(trainer.getId());
        vo.setTrainerName(trainer.getName());
        if (trainer.getProvinceId() != null && trainer.getProvinceId() > 0) {
            vo.setTrainerProvinceName(trainerRegionNameMap.get(trainer.getProvinceId()));
        }
        if (trainer.getCityId() != null && trainer.getCityId() > 0) {
            vo.setTrainerCityName(trainerRegionNameMap.get(trainer.getCityId()));
        }
    }

    private void collectTrainerRegionIds(Collection<Trainer> trainers, Set<Integer> regionIds) {
        if (trainers == null || regionIds == null) {
            return;
        }
        for (Trainer trainer : trainers) {
            if (trainer == null) {
                continue;
            }
            if (trainer.getProvinceId() != null && trainer.getProvinceId() > 0) {
                regionIds.add(trainer.getProvinceId());
            }
            if (trainer.getCityId() != null && trainer.getCityId() > 0) {
                regionIds.add(trainer.getCityId());
            }
        }
    }

    /** 同名专家取评分更高者，供迁移课程按主讲人姓名补常驻地。 */
    private Map<String, Trainer> buildTrainerByNameMap(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return Map.of();
        }
        List<Trainer> trainers = trainerService.findPublishedByNames(names.stream().toList());
        Map<String, Trainer> result = new HashMap<>();
        for (Trainer trainer : trainers) {
            if (trainer.getName() == null || trainer.getName().isBlank()) {
                continue;
            }
            String key = trainer.getName().trim();
            Trainer existing = result.get(key);
            if (existing == null || compareTrainerScore(trainer, existing) > 0) {
                result.put(key, trainer);
            }
            String normalized = normalizeTrainerLookupName(key);
            if (!normalized.isBlank() && !normalized.equals(key)) {
                existing = result.get(normalized);
                if (existing == null || compareTrainerScore(trainer, existing) > 0) {
                    result.put(normalized, trainer);
                }
            }
        }
        return result;
    }

    private static int compareTrainerScore(Trainer left, Trainer right) {
        BigDecimal leftScore = left.getScore() != null ? left.getScore() : BigDecimal.ZERO;
        BigDecimal rightScore = right.getScore() != null ? right.getScore() : BigDecimal.ZERO;
        return leftScore.compareTo(rightScore);
    }

    /** 迁移主讲人展示名归一化：去掉常见「老师/讲师」后缀便于匹配 user_trainers.name。 */
    private static String normalizeTrainerLookupName(String raw) {
        if (raw == null) {
            return "";
        }
        String name = raw.trim();
        for (String suffix : List.of("老师", "讲师", "教授", "导师")) {
            if (name.endsWith(suffix) && name.length() > suffix.length()) {
                return name.substring(0, name.length() - suffix.length()).trim();
            }
        }
        return name;
    }

    /**
     * 列表展示用课程天数：迁移库可能把学时等脏值写入 duration_days，此处做展示归一化。
     */
    private Integer normalizeDisplayDurationDays(Integer durationDays, BigDecimal totalHours) {
        if (durationDays != null && durationDays > 0 && durationDays <= 60) {
            return durationDays;
        }
        if (totalHours != null && totalHours.compareTo(BigDecimal.ZERO) > 0
                && totalHours.compareTo(new BigDecimal("480")) <= 0) {
            return Math.max(1, totalHours.divide(new BigDecimal("8"), 0, RoundingMode.HALF_UP).intValue());
        }
        return durationDays != null && durationDays > 0 ? 0 : durationDays;
    }

    /**
     * 公开课列表展示用计划：优先最近一场未开课（start &gt;= now），否则取最近一场历史排期。
     * <p>传入省/市筛选时，仅在该范围内挑选展示场次，避免「筛北京却展示上海最近一场」。</p>
     */
    private Map<Integer, CoursePlan> pickDisplayPlansForOpenCourses(List<Integer> openCourseIds,
                                                                    List<Integer> provinceIds,
                                                                    List<Integer> cityIds) {
        if (openCourseIds == null || openCourseIds.isEmpty()) {
            return Map.of();
        }
        boolean restrictLocation = (provinceIds != null && !provinceIds.isEmpty())
                || (cityIds != null && !cityIds.isEmpty());
        LocalDateTime now = LocalDateTime.now();
        List<CoursePlan> plans = coursePlanRepository.findByCourseIdInOrderByStartTimeAsc(openCourseIds);
        Map<Integer, CoursePlan> futurePick = new HashMap<>();
        Map<Integer, CoursePlan> latestPick = new HashMap<>();
        for (CoursePlan p : plans) {
            if (restrictLocation && !planMatchesLocationFilter(p, provinceIds, cityIds)) {
                continue;
            }
            latestPick.put(p.getCourseId(), p);
            if (!p.getStartTime().isBefore(now)) {
                futurePick.putIfAbsent(p.getCourseId(), p);
            }
        }
        Map<Integer, CoursePlan> result = new HashMap<>();
        for (Integer courseId : openCourseIds) {
            CoursePlan pick = futurePick.get(courseId);
            if (pick == null) {
                pick = latestPick.get(courseId);
            }
            if (pick != null) {
                result.put(courseId, pick);
            }
        }
        return result;
    }

    private static boolean planMatchesLocationFilter(CoursePlan plan,
                                                     List<Integer> provinceIds,
                                                     List<Integer> cityIds) {
        if (plan == null) {
            return false;
        }
        if (provinceIds != null && !provinceIds.isEmpty()) {
            if (plan.getProvinceId() == null || !provinceIds.contains(plan.getProvinceId())) {
                return false;
            }
        }
        if (cityIds != null && !cityIds.isEmpty()) {
            if (plan.getCityId() == null || !cityIds.contains(plan.getCityId())) {
                return false;
            }
        }
        return true;
    }

    /**
     * 详情页对外课程编号：即将开课且 sortOrder&gt;0 优先；否则任意 sortOrder&gt;0；再回退 courseId。
     */
    private Integer resolveDisplayCourseNo(Integer courseId, List<CoursePlan> plans) {
        if (plans == null || plans.isEmpty()) {
            return courseId;
        }
        LocalDateTime now = LocalDateTime.now();
        Optional<CoursePlan> upcoming = plans.stream()
                .filter(p -> p.getSortOrder() != null && p.getSortOrder() > 0)
                .filter(p -> p.getStartTime() != null && !p.getStartTime().isBefore(now))
                .min(Comparator.comparing(CoursePlan::getStartTime));
        if (upcoming.isPresent()) {
            return upcoming.get().getSortOrder();
        }
        Optional<CoursePlan> anyLegacy = plans.stream()
                .filter(p -> p.getSortOrder() != null && p.getSortOrder() > 0)
                .max(Comparator.comparing(CoursePlan::getStartTime,
                        Comparator.nullsLast(Comparator.naturalOrder())));
        return anyLegacy.map(CoursePlan::getSortOrder).orElse(courseId);
    }

    private Integer resolveSeoPathId(Integer courseId, CoursePlan nearest) {
        if (nearest != null && nearest.getSortOrder() != null && nearest.getSortOrder() > 0) {
            return nearest.getSortOrder();
        }
        return courseId;
    }

    private String formatPlanLocation(CoursePlan plan, Map<Integer, String> regionNameMap) {
        if (plan.getOnlineUrl() != null && !plan.getOnlineUrl().isBlank()) {
            return "线上";
        }
        if (plan.getAddress() != null && !plan.getAddress().isBlank()) {
            return plan.getAddress().trim();
        }
        String province = plan.getProvinceId() != null && plan.getProvinceId() > 0
                ? regionNameMap.get(plan.getProvinceId()) : null;
        String city = plan.getCityId() != null && plan.getCityId() > 0
                ? regionNameMap.get(plan.getCityId()) : null;
        if (province != null && city != null && !province.equals(city)) {
            return province + " " + city;
        }
        if (city != null) {
            return city;
        }
        if (province != null) {
            return province;
        }
        return null;
    }

    /** 迁移期：从 tk_courseinfo.cid → tk_cate 取分类展示名 */
    private Optional<String> resolveLegacyCategoryNameForCourse(Integer courseId) {
        if (courseId == null || courseId <= 0) {
            return Optional.empty();
        }
        try {
            return legacyTaokeCourseReader.findCourseCategoryNameByCourseId(courseId);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    /**
     * 根据前端传入的 sortBy 值解析排序规则
     */
    /**
     * 展开课程分类筛选：一级分类含全部子级，并与二级分类合并，匹配 category_id / sub_category_id。
     */
    private Set<Integer> resolveExpandedCourseCategoryIds(PublicCourseQuery query) {
        Set<Integer> ids = new HashSet<>();
        if (query.getCategoryIds() != null) {
            for (Integer id : query.getCategoryIds()) {
                if (id == null || id <= 0) {
                    continue;
                }
                ids.add(id);
                appendCourseCategoryDescendants(id, ids);
            }
        }
        if (query.getSubCategoryIds() != null) {
            query.getSubCategoryIds().stream()
                    .filter(id -> id != null && id > 0)
                    .forEach(ids::add);
        }
        return ids;
    }

    private void appendCourseCategoryDescendants(Integer parentId, Set<Integer> out) {
        List<CategoryTreeVO> children = categoryService.getChildren("COURSE_CATEGORY", parentId);
        for (CategoryTreeVO child : children) {
            out.add(child.getId());
            appendCourseCategoryDescendants(child.getId(), out);
        }
    }

    /**
     * 公开课列表「开课时间」才走计划维相关子查询；内训「发布时间」走 publishedAt。
     */
    private boolean isPlanStartTimeSort(String sortBy, Boolean isOpen) {
        if (!Boolean.TRUE.equals(isOpen)) {
            return false;
        }
        return "time".equals(sortBy) || "time_asc".equals(sortBy);
    }

    /** 三段式第 1 段：仅投影主键分页 */
    private List<Integer> findCourseIdsBySpec(Specification<Course> spec, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Integer> cq = cb.createQuery(Integer.class);
        Root<Course> root = cq.from(Course.class);
        Predicate predicate = spec.toPredicate(root, cq, cb);
        if (predicate != null) {
            cq.where(predicate);
        }
        cq.select(root.get("id"));
        List<jakarta.persistence.criteria.Order> orders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            orders.add(order.isAscending()
                    ? cb.asc(root.get(order.getProperty()))
                    : cb.desc(root.get(order.getProperty())));
        }
        if (!orders.isEmpty()) {
            cq.orderBy(orders);
        }
        return entityManager.createQuery(cq)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();
    }

    private long countCoursesBySpec(Specification<Course> spec) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<Course> root = cq.from(Course.class);
        Predicate predicate = spec.toPredicate(root, cq, cb);
        if (predicate != null) {
            cq.where(predicate);
        }
        cq.select(cb.count(root));
        return entityManager.createQuery(cq).getSingleResult();
    }

    /** 投影 → Course 壳对象，供既有 assembleListItems 复用（不含大字段） */
    private Course toCourseShell(CourseListCoreProjection p) {
        Course c = new Course();
        c.setId(p.getId());
        c.setTitle(p.getTitle());
        c.setType(p.getType());
        c.setCoverUrl(p.getCoverUrl());
        c.setCategoryId(p.getCategoryId());
        c.setSubCategoryId(p.getSubCategoryId());
        c.setDurationDays(p.getDurationDays());
        c.setTotalHours(p.getTotalHours());
        c.setPrice(p.getPrice());
        c.setOriginalPrice(p.getOriginalPrice());
        c.setIsFeatured(p.getIsFeatured());
        c.setIsFree(p.getIsFree());
        c.setStatus(p.getStatus());
        c.setViewCount(p.getViewCount());
        c.setEnrollmentCount(p.getEnrollmentCount());
        c.setScore(p.getScore());
        c.setPublisherType(p.getPublisherType());
        c.setPublisherId(p.getPublisherId());
        c.setTrainerId(p.getTrainerId());
        c.setKeywords(p.getKeywords());
        c.setPublishedAt(p.getPublishedAt());
        c.setCreatedAt(p.getCreatedAt());
        c.setCourseOpenEndDate(p.getCourseOpenEndDate());
        c.setIsExpireHide(p.getIsExpireHide());
        c.setSortOrder(p.getSortOrder());
        return c;
    }

    /**
     * 按列表展示用的「最近一场开课时间」排序，逻辑与 {@link #pickDisplayPlansForOpenCourses} 一致：
     * 优先取 startTime &gt;= now 的最早场次，否则取历史最近一场。
     */
    private Page<Course> findCoursesSortedByDisplayPlanStart(
            Specification<Course> spec,
            Sort.Direction direction,
            Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Course> countRoot = countQuery.from(Course.class);
        Predicate countPredicate = spec.toPredicate(countRoot, countQuery, cb);
        if (countPredicate != null) {
            countQuery.where(countPredicate);
        }
        countQuery.select(cb.count(countRoot));
        long total = entityManager.createQuery(countQuery).getSingleResult();
        if (total == 0) {
            return Page.empty(pageable);
        }

        CriteriaQuery<Course> cq = cb.createQuery(Course.class);
        Root<Course> root = cq.from(Course.class);
        LocalDateTime now = LocalDateTime.now();

        Subquery<LocalDateTime> futureMinSq = cq.subquery(LocalDateTime.class);
        Root<CoursePlan> futurePlan = futureMinSq.from(CoursePlan.class);
        futureMinSq.select(cb.function("min", LocalDateTime.class, futurePlan.get("startTime")));
        futureMinSq.where(
                cb.equal(futurePlan.get("courseId"), root.get("id")),
                cb.greaterThanOrEqualTo(futurePlan.get("startTime"), now));

        Subquery<LocalDateTime> latestMaxSq = cq.subquery(LocalDateTime.class);
        Root<CoursePlan> latestPlan = latestMaxSq.from(CoursePlan.class);
        latestMaxSq.select(cb.function("max", LocalDateTime.class, latestPlan.get("startTime")));
        latestMaxSq.where(cb.equal(latestPlan.get("courseId"), root.get("id")));

        LocalDateTime nullSentinel = direction == Sort.Direction.DESC
                ? LocalDateTime.of(1970, 1, 1, 0, 0)
                : LocalDateTime.of(2099, 12, 31, 23, 59, 59);
        Expression<LocalDateTime> displayStart = cb.coalesce(
                cb.coalesce(futureMinSq, latestMaxSq),
                cb.literal(nullSentinel));

        Predicate predicate = spec.toPredicate(root, cq, cb);
        if (predicate != null) {
            cq.where(predicate);
        }
        cq.select(root);
        if (direction == Sort.Direction.DESC) {
            cq.orderBy(cb.desc(displayStart), cb.desc(root.get("id")));
        } else {
            cq.orderBy(cb.asc(displayStart), cb.desc(root.get("id")));
        }

        List<Course> content = entityManager.createQuery(cq)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();
        return new PageImpl<>(content, pageable, total);
    }

    private Sort resolvePublicSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank() || "default".equals(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "sortOrder")
                    .and(Sort.by(Sort.Direction.DESC, "publishedAt"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        }
        return switch (sortBy) {
            case "price" -> Sort.by(Sort.Direction.ASC, "price")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "score" -> Sort.by(Sort.Direction.DESC, "score")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "score_asc" -> Sort.by(Sort.Direction.ASC, "score")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "time" -> Sort.by(Sort.Direction.DESC, "publishedAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "time_asc" -> Sort.by(Sort.Direction.ASC, "publishedAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            // 仅按上架时间（城市频道「最新」等，避开计划维开课时间排序）
            case "published" -> Sort.by(Sort.Direction.DESC, "publishedAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "default_asc" -> Sort.by(Sort.Direction.ASC, "sortOrder")
                    .and(Sort.by(Sort.Direction.ASC, "publishedAt"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "viewCount" -> Sort.by(Sort.Direction.DESC, "viewCount")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            default -> Sort.by(Sort.Direction.DESC, "sortOrder")
                    .and(Sort.by(Sort.Direction.DESC, "publishedAt"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        };
    }

    @Override
    public PageResponse<CourseListItemVO> listByInstitution(Integer institutionId, String type,
                                                             int page, int size) {
        if (institutionId == null) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        Institution institution;
        try {
            institution = institutionService.resolvePublicByPathId(institutionId);
        } catch (BusinessException ex) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        Integer institutionUserId = institution.getUserId();

        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()));
            predicates.add(cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION));
            predicates.add(cb.equal(root.get("publisherId"), institutionUserId));
            predicates.add(OpenCourseExpireSupport.publicVisiblePredicate(root, cb, LocalDate.now()));

            if ("OPEN".equalsIgnoreCase(type)) {
                predicates.add(root.get("type").in(CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE));
            } else if ("INNER".equalsIgnoreCase(type)) {
                predicates.add(cb.equal(root.get("type"), CourseType.INTERNAL));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        // 默认按上线时间倒序展示（机构介绍 tab 用）
        Sort sort = Sort.by(Sort.Direction.DESC, "publishedAt").and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Page<Course> coursePage = courseRepository.findAll(spec, pageable);

        if (coursePage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        return PageResponse.of(assembleListItems(coursePage.getContent()),
                coursePage.getTotalElements(), page, size);
    }

    @Override
    public List<CourseListItemVO> listInstitutionSidebarOpenCourses(Integer institutionId) {
        if (institutionId == null) {
            return List.of();
        }
        Institution institution;
        try {
            institution = institutionService.resolvePublicByPathId(institutionId);
        } catch (BusinessException ex) {
            return List.of();
        }
        Integer institutionUserId = institution.getUserId();

        Specification<Course> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()),
                cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION),
                cb.equal(root.get("publisherId"), institutionUserId),
                root.get("type").in(CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE),
                OpenCourseExpireSupport.publicVisiblePredicate(root, cb, LocalDate.now())
        );
        // 排序：last_enrolled_at DESC（NULL 在最后），view_count DESC，id DESC
        Sort sort = Sort.by(Sort.Direction.DESC, "lastEnrolledAt")
                .and(Sort.by(Sort.Direction.DESC, "viewCount"))
                .and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(0, 6, sort);
        return assembleListItems(courseRepository.findAll(spec, pageable).getContent());
    }

    @Override
    public List<CourseListItemVO> listHotOpenCourses() {
        Specification<Course> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()),
                root.get("type").in(CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE),
                OpenCourseExpireSupport.publicVisiblePredicate(root, cb, LocalDate.now())
        );
        Sort sort = Sort.by(Sort.Direction.DESC, "lastEnrolledAt")
                .and(Sort.by(Sort.Direction.DESC, "createdAt"))
                .and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(0, 5, sort);
        return assembleListItems(courseRepository.findAll(spec, pageable).getContent());
    }

    @Override
    public List<Integer> listRecentlyActiveInstitutionUserIds(int days, int limit) {
        int d = days > 0 ? days : 7;
        int n = limit > 0 ? limit : 5;
        LocalDateTime since = LocalDateTime.now().minusDays(d);
        return courseRepository.findRecentlyActiveInstitutionUserIds(since, PageRequest.of(0, n));
    }

    @Override
    public PageResponse<CourseListItemVO> listByTrainer(Integer trainerId, int page, int size) {
        if (trainerId == null || trainerId <= 0) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        // 直接按 trainer_id 过滤，不做同名合并——不同专家即使同名，课程也不应混在一起
        Specification<Course> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("trainerId"), trainerId),
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()),
                OpenCourseExpireSupport.publicVisiblePredicate(root, cb, LocalDate.now())
        );
        Sort sort = Sort.by(Sort.Direction.DESC, "publishedAt")
                .and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Page<Course> coursePage = courseRepository.findAll(spec, pageable);
        if (coursePage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        return PageResponse.of(assembleListItems(coursePage.getContent()),
                coursePage.getTotalElements(), page, size);
    }

    @Override
    public List<RecommendedCourseVO> listRecommendedByTrainer(Integer trainerId) {
        if (trainerId == null || trainerId <= 0) {
            return List.of();
        }
        Specification<Course> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("trainerId"), trainerId),
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()),
                OpenCourseExpireSupport.publicVisiblePredicate(root, cb, LocalDate.now())
        );
        PageRequest pageable = PageRequest.of(0, 3,
                Sort.by(Sort.Direction.DESC, "viewCount").and(Sort.by(Sort.Direction.DESC, "id")));
        String trainerAvatar = trainerService.findByIds(Set.of(trainerId)).stream()
                .findFirst()
                .map(Trainer::getAvatar)
                .orElse(null);
        return courseRepository.findAll(spec, pageable).getContent().stream()
                .map(course -> {
                    RecommendedCourseVO vo = new RecommendedCourseVO();
                    vo.setId(course.getId());
                    vo.setTitle(course.getTitle());
                    String categoryName = null;
                    if (course.getCategoryId() != null && course.getCategoryId() > 0) {
                        categoryName = categoryService.getNameMap(Set.of(course.getCategoryId()))
                                .get(course.getCategoryId());
                    }
                    if (categoryName == null || categoryName.isBlank()) {
                        categoryName = resolveLegacyCategoryNameForCourse(course.getId()).orElse(null);
                    }
                    String legacyCover = legacyTaokeCourseReader.findCoverUrlsByCourseIds(List.of(course.getId()))
                            .get(course.getId());
                    vo.setCoverUrl(resolveCoverUrl(course, firstNonBlank(course.getCoverUrl(), legacyCover),
                            trainerAvatar, categoryName));
                    vo.setViewCount(course.getViewCount());
                    vo.setType(course.getType() != null ? course.getType().name() : null);
                    return vo;
                })
                .toList();
    }

    // ==================== 后台管理 ====================

    @Override
    public Page<Course> searchForAdmin(String keyword, Integer status, String type,
                                       Integer trainerId, java.util.Collection<Integer> trainerIds,
                                       String publisherType, Integer publisherId,
                                       java.util.Collection<Integer> publisherUserIds,
                                       Pageable pageable) {
        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(root.get("type"), CourseType.valueOf(type)));
            }
            if (trainerIds != null && !trainerIds.isEmpty()) {
                predicates.add(root.get("trainerId").in(trainerIds));
            } else if (trainerId != null && trainerId > 0) {
                predicates.add(cb.equal(root.get("trainerId"), trainerId));
            }
            if (publisherType != null && !publisherType.isBlank()) {
                predicates.add(cb.equal(root.get("publisherType"), publisherType.trim()));
            }
            if (publisherId != null && publisherId > 0) {
                predicates.add(cb.equal(root.get("publisherId"), publisherId));
            }
            if (publisherUserIds != null && !publisherUserIds.isEmpty()) {
                predicates.add(root.get("publisherId").in(publisherUserIds));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), like),
                        cb.like(root.get("keywords"), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return courseRepository.findAll(spec, pageable);
    }

    @Override
    public java.util.Map<Integer, Long> countByPublisherIds(java.util.Collection<Integer> publisherIds) {
        if (publisherIds == null || publisherIds.isEmpty()) {
            return java.util.Map.of();
        }
        java.util.Map<Integer, Long> map = new java.util.HashMap<>();
        for (Object[] row : courseRepository.countGroupByPublisherIds(publisherIds)) {
            map.put((Integer) row[0], (Long) row[1]);
        }
        return map;
    }

    @Override
    public CourseDetailVO getDetailForAdmin(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        return assembleDetail(course);
    }

    @Transactional
    @Override
    public void approve(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        if (course.getStatus() != CourseStatus.PENDING.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅待审核的课程可审核通过");
        }
        course.setStatus(CourseStatus.PUBLISHED.getValue());
        course.setPublishedAt(LocalDateTime.now());
        course.setRejectReason("");
        courseRepository.save(course);
        syncOpenEndDateFromPlans(courseId, course.getType());
        publicCourseListCache.evictPublicListCaches();
    }

    @Transactional
    @Override
    public void reject(Integer courseId, String reason) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        if (course.getStatus() != CourseStatus.PENDING.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅待审核的课程可驳回");
        }
        course.setStatus(CourseStatus.REJECTED.getValue());
        course.setRejectReason(reason);
        courseRepository.save(course);
    }

    @Transactional
    @Override
    public void adminUnpublish(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        if (course.getStatus() != CourseStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅已上架的课程可下架");
        }
        course.setStatus(CourseStatus.UNPUBLISHED.getValue());
        courseRepository.save(course);
        publicCourseListCache.evictPublicListCaches();
    }

    @Transactional
    @Override
    public void toggleFeatured(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        course.setIsFeatured(course.getIsFeatured() == 1 ? 0 : 1);
        courseRepository.save(course);
    }

    @Override
    public boolean hasCategoryReference(Integer categoryId) {
        Specification<Course> spec = (root, cq, cb) -> cb.or(
                cb.equal(root.get("categoryId"), categoryId),
                cb.equal(root.get("subCategoryId"), categoryId)
        );
        return courseRepository.count(spec) > 0;
    }

    // ==================== 内部方法 ====================

    /**
     * 根据 hasPlan 标志自动推断课程类型：
     * hasPlan=0（或未传）→ INTERNAL；hasPlan=1 → 从 type 字段解析为 OPEN_OFFLINE / OPEN_ONLINE
     */
    private CourseType resolveCourseType(SaveCourseRequest request) {
        if (request.getHasPlan() != null && request.getHasPlan() == 1) {
            return parseCourseType(request.getType());
        }
        return CourseType.INTERNAL;
    }

    private CourseType parseCourseType(String typeStr) {
        try {
            return CourseType.valueOf(typeStr);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "不支持的课程类型: " + typeStr);
        }
    }

    /** 机构只能发布公开课 */
    private void validatePublisherType(String publisherType, CourseType type) {
        if (BusinessRole.Code.INSTITUTION.equals(publisherType) && !type.isOpen()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "机构只能发布公开课");
        }
    }

    /**
     * 封面必填（含草稿）
     *
     * @author Fangxinxin
     * @date 2026-07-17 16:14
     */
    private void validateCoverRequired(SaveCourseRequest request) {
        if (request.getCoverUrl() == null || request.getCoverUrl().isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请上传课程封面");
        }
    }

    /** 提交审核时的内容完整性校验（草稿不做此校验，封面由 validateCoverRequired 单独校验） */
    private void validateForSubmit(SaveCourseRequest request) {
        validateCoverRequired(request);
        if (isBlankHtml(request.getIntro())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请填写课程介绍");
        }
        if (request.getCategoryId() == null || request.getCategoryId() <= 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请选择课程分类");
        }
        if (request.getDurationDays() == null || request.getDurationDays() < 1) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "课程天数至少 1 天");
        }
        if (request.getTotalHours() == null || request.getTotalHours().compareTo(BigDecimal.ONE) < 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "课程总时长至少 1 小时");
        }
    }

    /** 富文本去标签后是否为空（含仅 &nbsp; / 空段落 / 零宽字符） */
    private static boolean isBlankHtml(String html) {
        if (html == null || html.isBlank()) {
            return true;
        }
        String text = html.replaceAll("<[^>]*>", "")
                .replace("&nbsp;", " ")
                .replace('\u00A0', ' ')
                .replace("\u200B", "")
                .replaceAll("\\s+", " ")
                .trim();
        return text.isEmpty();
    }

    /** 公开课必须有计划，且按类型校验必填字段 */
    private void validatePlans(CourseType type, List<CoursePlanDTO> plans) {
        if (!type.isOpen()) {
            return;
        }
        if (plans == null || plans.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "公开课必须添加至少一条开课计划");
        }
        for (int i = 0; i < plans.size(); i++) {
            CoursePlanDTO plan = plans.get(i);
            String label = "开课计划 " + (i + 1);
            if (plan.getStartTime() == null) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, label + "：请填写开始时间");
            }
            if (plan.getEndTime() == null) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, label + "：请填写结束时间");
            }
            if (!plan.getEndTime().isAfter(plan.getStartTime())) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, label + "：结束时间必须晚于开始时间");
            }
            if (type == CourseType.OPEN_OFFLINE) {
                if (plan.getProvinceId() == null || plan.getProvinceId() == 0) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "线下公开课的开课计划必须选择省份");
                }
                if (plan.getCityId() == null || plan.getCityId() == 0) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "线下公开课的开课计划必须选择城市");
                }
                if (plan.getAddress() == null || plan.getAddress().isBlank()) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "线下公开课的开课计划必须填写具体地址");
                }
            } else if (type == CourseType.OPEN_ONLINE) {
                if (plan.getOnlineUrl() == null || plan.getOnlineUrl().isBlank()) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "线上公开课的开课计划必须填写开课网址");
                }
                try {
                    CourseOnlineUrlValidator.validateRequiredOnlineUrl(plan.getOnlineUrl().trim());
                } catch (IllegalArgumentException ex) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, ex.getMessage());
                }
            }
        }
    }

    /** 将请求体的字段应用到实体 */
    private void applyRequest(Course course, SaveCourseRequest req, CourseType type) {
        course.setTitle(req.getTitle());
        course.setType(type);
        if (req.getCategoryId() != null) course.setCategoryId(req.getCategoryId());
        if (req.getSubCategoryId() != null) course.setSubCategoryId(req.getSubCategoryId());
        if (req.getCoverUrl() != null) course.setCoverUrl(req.getCoverUrl());
        course.setIntro(req.getIntro());
        if (req.getSummary() != null) course.setSummary(req.getSummary());
        if (req.getSyllabus() != null) course.setSyllabus(req.getSyllabus());
        if (req.getMaterialUrl() != null) course.setMaterialUrl(req.getMaterialUrl());
        if (req.getMaterialText() != null) course.setMaterialText(req.getMaterialText());
        if (req.getAudience() != null) course.setAudience(req.getAudience());
        if (req.getHighlights() != null) course.setHighlights(req.getHighlights());
        if (req.getDurationDays() != null) course.setDurationDays(req.getDurationDays());
        if (req.getTotalHours() != null) course.setTotalHours(req.getTotalHours());
        if (req.getPrice() != null) course.setPrice(req.getPrice());
        if (req.getOriginalPrice() != null) course.setOriginalPrice(req.getOriginalPrice());
        if (req.getKeywords() != null) course.setKeywords(req.getKeywords());
        if (req.getIsFeatured() != null) course.setIsFeatured(req.getIsFeatured());
        if (req.getIsFree() != null) course.setIsFree(req.getIsFree());
        if (req.getHasPlan() != null) course.setHasPlan(req.getHasPlan());
    }

    /** 专家发布时自动关联 trainerId */
    private void bindTrainerId(Course course, Integer userId) {
        List<Trainer> trainers = trainerService.findByUserIds(List.of(userId));
        if (!trainers.isEmpty()) {
            course.setTrainerId(trainers.get(0).getId());
        }
    }

    /** 保存开课计划 */
    private void savePlans(Integer courseId, CourseType type, List<CoursePlanDTO> plans) {
        if (!type.isOpen() || plans == null || plans.isEmpty()) {
            return;
        }
        int sortOrder = 0;
        for (CoursePlanDTO dto : plans) {
            CoursePlan plan = courseMapper.toPlanEntity(dto);
            plan.setCourseId(courseId);
            plan.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : sortOrder++);

            if (type == CourseType.OPEN_ONLINE) {
                plan.setProvinceId(0);
                plan.setCityId(0);
                plan.setDistrictId(0);
                plan.setAddress("");
            } else {
                plan.setOnlineUrl("");
                if (dto.getDistrictId() != null) {
                    plan.setDistrictId(dto.getDistrictId());
                }
            }

            coursePlanRepository.save(plan);
        }
    }

    /**
     * 获取课程并校验当前操作者是否有权操作。
     * <p>
     * 通过条件之一：
     * <ul>
     *   <li>本人是发布者</li>
     *   <li>课程归属专家（publisherType=TRAINER），且当前操作者通过绑定关系可代管该专家</li>
     * </ul>
     */
    private Course getOwnedCourse(Integer courseId, Integer operatorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        if (course.getPublisherId().equals(operatorUserId)) {
            return course;
        }
        if (BusinessRole.Code.TRAINER.equals(course.getPublisherType())) {
            bindingAuthority.requireCanManageTrainer(operatorUserId, course.getPublisherId());
            return course;
        }
        if (BusinessRole.Code.ENTERPRISE_AGENT.equals(course.getPublisherType())) {
            // 经纪人可管理隶属经纪公司发布的课程
            bindingAuthority.requireAgentBelongsToEnterprise(operatorUserId, course.getPublisherId());
            return course;
        }
        throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作此课程");
    }

    /**
     * 课程编辑允许的状态：
     * <ul>
     *   <li>DRAFT — 历史草稿数据，仍可继续编辑并提交审核</li>
     *   <li>PENDING — 审核中也允许编辑（编辑后保持 PENDING）</li>
     *   <li>REJECTED — 驳回后修改重新提交</li>
     *   <li>PUBLISHED / UNPUBLISHED — 已上架/已下架仍可修改内容，保存后回到 PENDING 等待复审</li>
     * </ul>
     */
    private void assertEditable(Course course) {
        // 当前所有状态均可编辑（保存后由 update 方法统一回到 PENDING）
        if (course.getStatus() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "课程状态异常，无法编辑");
        }
    }

    /** 组装课程详情（含开课计划 + 分类名 + 讲师名） */
    private CourseDetailVO assembleDetail(Course course) {
        CourseDetailVO vo = courseMapper.toDetailVO(course);
        vo.setTypeLabel(course.getType().getLabel());
        vo.setStatusLabel(CourseStatus.of(course.getStatus()).getLabel());

        // 开课计划（附带省市名称，供详情页展示地点）
        List<CoursePlan> planEntities = List.of();
        if (course.getType().isOpen()) {
            planEntities = coursePlanRepository.findByCourseIdOrderBySortOrder(course.getId());
            vo.setPlans(enrichPlanDTOs(courseMapper.toPlanDTOList(planEntities)));
        } else {
            vo.setPlans(List.of());
        }
        vo.setDisplayCourseNo(resolveDisplayCourseNo(course.getId(), planEntities));

        // 批量获取分类名称
        Set<Integer> catIds = new HashSet<>();
        if (course.getCategoryId() != null && course.getCategoryId() > 0) catIds.add(course.getCategoryId());
        if (course.getSubCategoryId() != null && course.getSubCategoryId() > 0) catIds.add(course.getSubCategoryId());
        if (!catIds.isEmpty()) {
            Map<Integer, String> nameMap = categoryService.getNameMap(catIds);
            vo.setCategoryName(nameMap.get(course.getCategoryId()));
            vo.setSubCategoryName(nameMap.get(course.getSubCategoryId()));
        }
        if (vo.getCategoryName() == null || vo.getCategoryName().isBlank()) {
            resolveLegacyCategoryNameForCourse(course.getId()).ifPresent(vo::setCategoryName);
        }
        String legacyCover = legacyTaokeCourseReader.findCoverUrlsByCourseIds(List.of(course.getId()))
                .get(course.getId());
        String coverUrlForDisplay = firstNonBlank(course.getCoverUrl(), legacyCover);

        // 讲师名称 + 封面回退（无 cover_url 时用讲师头像 / 默认封面池）
        if (course.getTrainerId() != null && course.getTrainerId() > 0) {
            List<Trainer> trainers = trainerService.findByIds(Set.of(course.getTrainerId()));
            if (!trainers.isEmpty()) {
                Trainer trainer = trainers.get(0);
                vo.setTrainerName(trainer.getName());
                Map<Integer, String> avatarMap = trainerService.resolveDisplayAvatars(Set.of(trainer.getId()));
                String trainerAvatar = avatarMap.getOrDefault(trainer.getId(), trainer.getAvatar());
                vo.setCoverUrl(resolveCoverUrl(course, coverUrlForDisplay, trainerAvatar, vo.getCategoryName()));
            } else {
                vo.setCoverUrl(resolveCoverUrl(course, coverUrlForDisplay, null, vo.getCategoryName()));
            }
        } else {
            resolveLegacyLecturerName(course.getId()).ifPresent(vo::setTrainerName);
            vo.setCoverUrl(resolveCoverUrl(course, coverUrlForDisplay, null, vo.getCategoryName()));
        }

        Map<Integer, Integer> legacyOrganizerUserIds = legacyTaokeCourseReader.findOrganizerUserIds(List.of(course.getId()));
        Map<Integer, String> legacyOrganizerFromLecturer =
                legacyTaokeCourseReader.findOrganizerNamesFromLecturer(List.of(course.getId()));
        Set<Integer> institutionLookupUserIds = new HashSet<>();
        if (BusinessRole.Code.INSTITUTION.equals(course.getPublisherType())
                && course.getPublisherId() != null && course.getPublisherId() > 0) {
            institutionLookupUserIds.add(course.getPublisherId());
        }
        Integer legacyOrganUserId = legacyOrganizerUserIds.get(course.getId());
        if (legacyOrganUserId != null && legacyOrganUserId > 0) {
            institutionLookupUserIds.add(legacyOrganUserId);
        }
        Map<Integer, Institution> institutionByUserId = institutionLookupUserIds.isEmpty()
                ? Map.of()
                : institutionService.findByUserIds(institutionLookupUserIds.stream().toList()).stream()
                    .collect(Collectors.toMap(Institution::getUserId, i -> i, (a, b) -> a));
        Map<Integer, String> legacyMemberNameMap = legacyOrganUserId != null && legacyOrganUserId > 0
                ? legacyTaokeCourseReader.findMemberDisplayNames(List.of(legacyOrganUserId))
                : Map.of();
        String organizerName = resolveOrganizerName(
                course, institutionByUserId, legacyOrganizerUserIds, legacyOrganizerFromLecturer, legacyMemberNameMap);
        if (organizerName != null) {
            vo.setPublisherName(organizerName);
        }

        vo.setCourseOpenEndDate(course.getCourseOpenEndDate());
        vo.setIsExpireHide(course.getIsExpireHide());
        vo.setIsOverdue(OpenCourseExpireSupport.isOverdue(course));

        return vo;
    }

    /**
     * 解析公开课「开课单位」：机构发布者 &gt; 老库 organid 对应机构 &gt; lecturer 竖线后机构名 &gt; tk_member 公司名。
     */
    private String resolveOrganizerName(Course course,
                                        Map<Integer, Institution> institutionByUserId,
                                        Map<Integer, Integer> legacyOrganizerUserIds,
                                        Map<Integer, String> legacyOrganizerFromLecturer,
                                        Map<Integer, String> legacyMemberNameMap) {
        if (course == null) {
            return null;
        }
        if (BusinessRole.Code.INSTITUTION.equals(course.getPublisherType())
                && course.getPublisherId() != null && course.getPublisherId() > 0) {
            Institution inst = institutionByUserId.get(course.getPublisherId());
            if (inst != null && inst.getOrgName() != null && !inst.getOrgName().isBlank()) {
                return inst.getOrgName().trim();
            }
        }
        Integer organUserId = legacyOrganizerUserIds.get(course.getId());
        if (organUserId != null && organUserId > 0) {
            Institution inst = institutionByUserId.get(organUserId);
            if (inst != null && inst.getOrgName() != null && !inst.getOrgName().isBlank()) {
                return inst.getOrgName().trim();
            }
            String memberName = legacyMemberNameMap.get(organUserId);
            if (memberName != null && !memberName.isBlank()) {
                return memberName.trim();
            }
        }
        String fromLecturer = legacyOrganizerFromLecturer.get(course.getId());
        if (fromLecturer != null && !fromLecturer.isBlank()) {
            return fromLecturer.trim();
        }
        return null;
    }

    /** 机构发布等 trainer_id=0 时，从老库 lecturer 补展示名 */
    private Optional<String> resolveLegacyLecturerName(Integer courseId) {
        if (courseId == null || courseId <= 0) {
            return Optional.empty();
        }
        try {
            return legacyTaokeCourseReader.findLecturerDisplayName(courseId);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    /** 为开课计划 DTO 填充省市名称 */
    private List<CoursePlanDTO> enrichPlanDTOs(List<CoursePlanDTO> plans) {
        if (plans == null || plans.isEmpty()) {
            return List.of();
        }
        Set<Integer> regionIds = new HashSet<>();
        for (CoursePlanDTO p : plans) {
            if (p.getProvinceId() != null && p.getProvinceId() > 0) {
                regionIds.add(p.getProvinceId());
            }
            if (p.getCityId() != null && p.getCityId() > 0) {
                regionIds.add(p.getCityId());
            }
        }
        Map<Integer, String> regionNames = regionIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(regionIds);
        for (CoursePlanDTO p : plans) {
            if (p.getProvinceId() != null && p.getProvinceId() > 0) {
                p.setProvinceName(regionNames.get(p.getProvinceId()));
            }
            if (p.getCityId() != null && p.getCityId() > 0) {
                p.setCityName(regionNames.get(p.getCityId()));
            }
        }
        return plans;
    }

    /** 将课程转为列表项 VO */
    private CourseListItemVO toListItemVO(Course course) {
        CourseListItemVO vo = courseMapper.toListItemVO(course);
        vo.setTypeLabel(course.getType().getLabel());
        vo.setStatusLabel(CourseStatus.of(course.getStatus()).getLabel());

        if (course.getCategoryId() != null && course.getCategoryId() > 0) {
            Map<Integer, String> nameMap = categoryService.getNameMap(Set.of(course.getCategoryId()));
            vo.setCategoryName(nameMap.get(course.getCategoryId()));
        }

        if (course.getTrainerId() != null && course.getTrainerId() > 0) {
            List<Trainer> trainers = trainerService.findByIds(Set.of(course.getTrainerId()));
            if (!trainers.isEmpty()) {
                Trainer trainer = trainers.get(0);
                vo.setTrainerName(trainer.getName());
                Map<Integer, String> avatarMap = trainerService.resolveDisplayAvatars(Set.of(trainer.getId()));
                vo.setCoverUrl(resolveCoverUrl(course, avatarMap.getOrDefault(trainer.getId(), trainer.getAvatar()), vo.getCategoryName()));
            } else {
                vo.setCoverUrl(resolveCoverUrl(course, null, vo.getCategoryName()));
            }
        } else {
            vo.setCoverUrl(resolveCoverUrl(course, null, vo.getCategoryName()));
        }

        vo.setIsOverdue(OpenCourseExpireSupport.isOverdue(course));

        return vo;
    }

    /**
     * 解析列表/详情展示用封面：自定义封面 &gt; 讲师头像 &gt; 默认封面素材池。
     */
    private String resolveCoverUrl(Course course, String trainerAvatar, String categoryName) {
        if (course == null) {
            return "";
        }
        return resolveCoverUrl(course, course.getCoverUrl(), trainerAvatar, categoryName);
    }

    private String resolveCoverUrl(Course course, String coverUrl, String trainerAvatar, String categoryName) {
        if (course == null) {
            return "";
        }
        String scene = resolveCoverMaterialScene(course.getType());
        int seed = course.getId() != null ? course.getId() : 0;
        return opsMaterialResolver.resolveCourseCoverUrl(
                coverUrl, trainerAvatar, categoryName, scene, seed);
    }

    private static String resolveCoverMaterialScene(CourseType type) {
        if (type == CourseType.INTERNAL) {
            return "INTERNAL";
        }
        if (type != null && type.isOpen()) {
            return "OPEN";
        }
        return "GENERAL";
    }

    private static String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate.trim();
            }
        }
        return null;
    }

    @Override
    public List<Course> findByIds(Set<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return courseRepository.findAllById(ids);
    }

    @Override
    public Page<CoursePlan> searchPlansForAdmin(Integer courseId, String keyword, Pageable pageable) {
        Specification<CoursePlan> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (courseId != null) {
                predicates.add(cb.equal(root.get("courseId"), courseId));
            }
            // keyword 匹配地址
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.like(root.get("address"), like));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return coursePlanRepository.findAll(spec, pageable);
    }

    @Override
    public List<CourseListItemVO> listRelatedForVideo(Integer categoryId, Integer subCategoryId, int limit) {
        Set<Integer> categoryIds = resolveRelatedCourseCategoryIds(categoryId, subCategoryId);
        if (categoryIds.isEmpty()) {
            return List.of();
        }

        int fetchLimit = limit <= 0 ? 6 : Math.min(limit, 20);
        Set<Integer> enrollingCourseIds = findCourseIdsByPlanFilter(
                null, null, null, null, "ENROLLING");

        Specification<Course> categorySpec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()),
                root.get("type").in(CourseType.INTERNAL, CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE),
                cb.or(
                        root.get("categoryId").in(categoryIds),
                        root.get("subCategoryId").in(categoryIds)
                ),
                OpenCourseExpireSupport.publicVisiblePredicate(root, cb, LocalDate.now())
        );

        Sort hotSort = Sort.by(Sort.Direction.DESC, "viewCount")
                .and(Sort.by(Sort.Direction.DESC, "lastEnrolledAt"))
                .and(Sort.by(Sort.Direction.DESC, "id"));

        List<Course> picked = new ArrayList<>();
        if (!enrollingCourseIds.isEmpty()) {
            Specification<Course> enrollingSpec = categorySpec.and(
                    (root, cq, cb) -> root.get("id").in(enrollingCourseIds));
            picked.addAll(courseRepository.findAll(enrollingSpec, PageRequest.of(0, fetchLimit, hotSort)).getContent());
        }
        if (picked.size() < fetchLimit) {
            Set<Integer> exclude = picked.stream().map(Course::getId).collect(Collectors.toSet());
            Specification<Course> restSpec = categorySpec;
            if (!exclude.isEmpty()) {
                restSpec = restSpec.and((root, cq, cb) -> cb.not(root.get("id").in(exclude)));
            }
            picked.addAll(courseRepository.findAll(
                    restSpec, PageRequest.of(0, fetchLimit - picked.size(), hotSort)).getContent());
        }
        return assembleListItems(picked);
    }

    /**
     * 录播课分类（VIDEO_COURSE）与面授课分类（COURSE_CATEGORY）分属不同 ID 空间，按名称对齐。
     */
    private Set<Integer> resolveRelatedCourseCategoryIds(Integer videoCategoryId, Integer videoSubCategoryId) {
        Set<Integer> videoCategoryIds = new HashSet<>();
        if (videoCategoryId != null && videoCategoryId > 0) {
            videoCategoryIds.add(videoCategoryId);
        }
        if (videoSubCategoryId != null && videoSubCategoryId > 0) {
            videoCategoryIds.add(videoSubCategoryId);
        }
        if (videoCategoryIds.isEmpty()) {
            return Set.of();
        }

        Set<String> targetNames = categoryService.getNameMap(videoCategoryIds).values().stream()
                .map(name -> name == null ? "" : name.trim())
                .filter(name -> !name.isEmpty())
                .collect(Collectors.toSet());
        if (targetNames.isEmpty()) {
            return Set.of();
        }

        return categoryRepository.findByTypeOrderBySortOrder("COURSE_CATEGORY").stream()
                .filter(category -> category.getName() != null
                        && targetNames.contains(category.getName().trim()))
                .map(Category::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /** 保存/更新开课计划后，同步线下公开课结束日期 */
    private void syncOpenEndDateFromPlans(Integer courseId, CourseType type) {
        if (type != CourseType.OPEN_OFFLINE) {
            return;
        }
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            return;
        }
        List<CoursePlan> plans = coursePlanRepository.findByCourseIdOrderBySortOrder(courseId);
        course.setCourseOpenEndDate(OpenCourseExpireSupport.resolveOpenEndDate(plans));
        if (course.getIsExpireHide() == null) {
            course.setIsExpireHide(1);
        }
        courseRepository.save(course);
    }

    @Transactional
    @Override
    public void batchUpdateExpireHide(List<Integer> courseIds, Integer isExpireHide) {
        if (courseIds == null || courseIds.isEmpty()) {
            return;
        }
        if (isExpireHide == null || (isExpireHide != 0 && isExpireHide != 1)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "到期自动隐藏仅支持 0 或 1");
        }
        List<Course> courses = courseRepository.findAllById(courseIds);
        for (Course course : courses) {
            course.setIsExpireHide(isExpireHide);
        }
        courseRepository.saveAll(courses);
    }
}
