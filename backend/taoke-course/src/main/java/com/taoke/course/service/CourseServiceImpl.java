package com.taoke.course.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.RegionService;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.*;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.course.mapper.CourseMapper;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final RegionService regionService;
    private final BindingAuthority bindingAuthority;

    // ==================== C 端发布者操作 ====================

    @Transactional
    @Override
    public CourseDetailVO create(Integer publisherId, String publisherType, SaveCourseRequest request) {
        CourseType type = resolveCourseType(request);
        validatePublisherType(publisherType, type);
        validatePlans(type, request.getPlans());

        Course course = new Course();
        applyRequest(course, request, type);
        course.setPublisherId(publisherId);
        course.setPublisherType(publisherType);
        // 创建即提交审核：发布者点击「提交审核」后课程直接进入待审核状态
        course.setStatus(CourseStatus.PENDING.getValue());

        // 专家发布时自动绑定 trainerId
        if (BusinessRole.Code.TRAINER.equals(publisherType)) {
            bindTrainerId(course, publisherId);
        }

        course = courseRepository.save(course);
        savePlans(course.getId(), type, request.getPlans());

        return assembleDetail(course);
    }

    @Transactional
    @Override
    public CourseDetailVO update(Integer courseId, Integer publisherId, SaveCourseRequest request) {
        Course course = getOwnedCourse(courseId, publisherId);
        assertEditable(course);

        CourseType type = resolveCourseType(request);
        validatePublisherType(course.getPublisherType(), type);
        validatePlans(type, request.getPlans());

        applyRequest(course, request, type);
        // 编辑后统一回到待审核：保存即提交，无论原状态是 DRAFT / PENDING / REJECTED 还是 PUBLISHED / UNPUBLISHED
        course.setStatus(CourseStatus.PENDING.getValue());
        course = courseRepository.save(course);

        // 整体替换开课计划
        coursePlanRepository.deleteByCourseId(courseId);
        savePlans(courseId, type, request.getPlans());

        return assembleDetail(course);
    }

    @Transactional
    @Override
    public void submitForReview(Integer courseId, Integer publisherId) {
        Course course = getOwnedCourse(courseId, publisherId);
        int status = course.getStatus();
        if (status != CourseStatus.DRAFT.getValue() && status != CourseStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的课程可提交审核");
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

        List<CourseListItemVO> items = coursePage.getContent().stream()
                .map(this::toListItemVO)
                .toList();
        return PageResponse.of(items, coursePage.getTotalElements(), page, size);
    }

    // ==================== 公开接口 ====================

    @Override
    public CourseDetailVO getPublicDetail(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        if (course.getStatus() != CourseStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "课程不存在");
        }
        return assembleDetail(course);
    }

    @Override
    public PageResponse<CourseListItemVO> listPublic(PublicCourseQuery query) {
        final int page = Math.max(1, query.getPage());
        final int size = query.getSize() <= 0 ? 15 : query.getSize();

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
        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()));

            if (query.getCategoryIds() != null && !query.getCategoryIds().isEmpty()) {
                predicates.add(root.get("categoryId").in(query.getCategoryIds()));
            }
            if (query.getSubCategoryIds() != null && !query.getSubCategoryIds().isEmpty()) {
                predicates.add(root.get("subCategoryId").in(query.getSubCategoryIds()));
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
            // 计划维度命中集合
            if (planIdsFinal != null) {
                predicates.add(root.get("id").in(planIdsFinal));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Sort sort = resolvePublicSort(query.getSortBy());
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Page<Course> coursePage = courseRepository.findAll(spec, pageable);

        if (coursePage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<CourseListItemVO> items = assembleListItems(coursePage.getContent());
        return PageResponse.of(items, coursePage.getTotalElements(), page, size);
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

        Specification<CoursePlan> spec = (root, cq, cb) -> {
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
            // ENROLLING：只看 startTime >= 当前时间的计划，命中即视为可报名
            if ("ENROLLING".equalsIgnoreCase(enrollStatus)) {
                ps.add(cb.greaterThanOrEqualTo(root.get("startTime"), now));
            }
            // ENDED：只看 startTime < 当前时间的计划；下方再排除掉那些"还存在未来计划"的课程
            if ("ENDED".equalsIgnoreCase(enrollStatus)) {
                ps.add(cb.lessThan(root.get("startTime"), now));
            }
            return ps.isEmpty() ? cb.conjunction() : cb.and(ps.toArray(Predicate[]::new));
        };

        // 一次性拉满匹配计划，按 courseId 去重
        List<CoursePlan> plans = coursePlanRepository.findAll(spec);
        Set<Integer> matched = plans.stream()
                .map(CoursePlan::getCourseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        // ENDED 还需排除"任意一条计划仍属未来"的课程
        if ("ENDED".equalsIgnoreCase(enrollStatus) && !matched.isEmpty()) {
            Specification<CoursePlan> futureSpec = (root, cq, cb) -> cb.and(
                    root.get("courseId").in(matched),
                    cb.greaterThanOrEqualTo(root.get("startTime"), now)
            );
            Set<Integer> withFuture = coursePlanRepository.findAll(futureSpec).stream()
                    .map(CoursePlan::getCourseId)
                    .collect(Collectors.toSet());
            matched.removeAll(withFuture);
        }

        return matched;
    }

    /**
     * 批量装配课程列表项 VO，统一回填分类名/讲师名/最近一场开课信息（公开课用）。
     *
     * @param courses 课程实体列表
     * @return 列表项 VO 集合，顺序与入参一致
     */
    public List<CourseListItemVO> assembleListItems(List<Course> courses) {
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
        Map<Integer, String> trainerNameMap = trainerIds.isEmpty()
                ? Map.of()
                : trainerService.findByIds(trainerIds).stream()
                    .collect(Collectors.toMap(Trainer::getId, Trainer::getName));

        // 批量最近一场公开课计划（仅公开课需要）
        List<Integer> openCourseIds = courses.stream()
                .filter(c -> c.getType() != null && c.getType().isOpen())
                .map(Course::getId)
                .toList();
        Map<Integer, CoursePlan> nearestPlanMap = new HashMap<>();
        if (!openCourseIds.isEmpty()) {
            List<CoursePlan> plans = coursePlanRepository
                    .findByCourseIdInAndStartTimeGreaterThanEqualOrderByStartTimeAsc(
                            openCourseIds, LocalDateTime.now());
            for (CoursePlan p : plans) {
                nearestPlanMap.putIfAbsent(p.getCourseId(), p);
            }
        }

        // 批量城市名
        Set<Integer> cityIds = nearestPlanMap.values().stream()
                .map(CoursePlan::getCityId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, String> cityNameMap = cityIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(cityIds);

        return courses.stream().map(c -> {
            CourseListItemVO vo = courseMapper.toListItemVO(c);
            vo.setTypeLabel(c.getType().getLabel());
            vo.setStatusLabel(CourseStatus.of(c.getStatus()).getLabel());
            if (c.getCategoryId() != null && c.getCategoryId() > 0) {
                vo.setCategoryName(catNameMap.get(c.getCategoryId()));
            }
            if (c.getTrainerId() != null && c.getTrainerId() > 0) {
                vo.setTrainerName(trainerNameMap.get(c.getTrainerId()));
            }
            CoursePlan nearest = nearestPlanMap.get(c.getId());
            if (nearest != null) {
                vo.setNextPlanStartDate(nearest.getStartTime());
                if (nearest.getCityId() != null && nearest.getCityId() > 0) {
                    vo.setNextPlanCity(cityNameMap.get(nearest.getCityId()));
                }
            }
            return vo;
        }).toList();
    }

    /**
     * 根据前端传入的 sortBy 值解析排序规则
     */
    private Sort resolvePublicSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank() || "default".equals(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "sortOrder")
                    .and(Sort.by(Sort.Direction.DESC, "publishedAt"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        }
        return switch (sortBy) {
            case "price" -> Sort.by(Sort.Direction.ASC, "price")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "score" -> Sort.by(Sort.Direction.DESC, "score")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "time" -> Sort.by(Sort.Direction.DESC, "publishedAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
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
        List<Institution> insts = institutionService.findByIds(List.of(institutionId));
        if (insts.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        Integer institutionUserId = insts.get(0).getUserId();

        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()));
            predicates.add(cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION));
            predicates.add(cb.equal(root.get("publisherId"), institutionUserId));

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
        List<Institution> insts = institutionService.findByIds(List.of(institutionId));
        if (insts.isEmpty()) {
            return List.of();
        }
        Integer institutionUserId = insts.get(0).getUserId();

        Specification<Course> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()),
                cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION),
                cb.equal(root.get("publisherId"), institutionUserId),
                root.get("type").in(CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE)
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
                root.get("type").in(CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE)
        );
        Sort sort = Sort.by(Sort.Direction.DESC, "lastEnrolledAt")
                .and(Sort.by(Sort.Direction.DESC, "createdAt"))
                .and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(0, 5, sort);
        return assembleListItems(courseRepository.findAll(spec, pageable).getContent());
    }

    @Override
    public PageResponse<CourseListItemVO> listByTrainer(Integer trainerId, int page, int size) {
        if (trainerId == null || trainerId <= 0) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        Specification<Course> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("trainerId"), trainerId),
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue())
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
                cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue())
        );
        PageRequest pageable = PageRequest.of(0, 3,
                Sort.by(Sort.Direction.DESC, "viewCount").and(Sort.by(Sort.Direction.DESC, "id")));
        return courseRepository.findAll(spec, pageable).getContent().stream()
                .map(course -> {
                    RecommendedCourseVO vo = new RecommendedCourseVO();
                    vo.setId(course.getId());
                    vo.setTitle(course.getTitle());
                    vo.setCoverUrl(course.getCoverUrl());
                    vo.setViewCount(course.getViewCount());
                    return vo;
                })
                .toList();
    }

    // ==================== 后台管理 ====================

    @Override
    public Page<Course> searchForAdmin(String keyword, Integer status, String type, Pageable pageable) {
        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(root.get("type"), CourseType.valueOf(type)));
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

    /** 公开课必须有计划，且按类型校验必填字段 */
    private void validatePlans(CourseType type, List<CoursePlanDTO> plans) {
        if (!type.isOpen()) {
            return;
        }
        if (plans == null || plans.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "公开课必须添加至少一条开课计划");
        }
        for (CoursePlanDTO plan : plans) {
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
        if (req.getSyllabus() != null) course.setSyllabus(req.getSyllabus());
        if (req.getAudience() != null) course.setAudience(req.getAudience());
        if (req.getHighlights() != null) course.setHighlights(req.getHighlights());
        if (req.getDurationDays() != null) course.setDurationDays(req.getDurationDays());
        if (req.getHoursPerDay() != null) course.setHoursPerDay(req.getHoursPerDay());
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

        // 开课计划
        if (course.getType().isOpen()) {
            List<CoursePlan> plans = coursePlanRepository.findByCourseIdOrderBySortOrder(course.getId());
            vo.setPlans(courseMapper.toPlanDTOList(plans));
        } else {
            vo.setPlans(List.of());
        }

        // 批量获取分类名称
        Set<Integer> catIds = new HashSet<>();
        if (course.getCategoryId() != null && course.getCategoryId() > 0) catIds.add(course.getCategoryId());
        if (course.getSubCategoryId() != null && course.getSubCategoryId() > 0) catIds.add(course.getSubCategoryId());
        if (!catIds.isEmpty()) {
            Map<Integer, String> nameMap = categoryService.getNameMap(catIds);
            vo.setCategoryName(nameMap.get(course.getCategoryId()));
            vo.setSubCategoryName(nameMap.get(course.getSubCategoryId()));
        }

        // 讲师名称
        if (course.getTrainerId() != null && course.getTrainerId() > 0) {
            fillTrainerName(vo, course.getTrainerId());
        }

        return vo;
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
                vo.setTrainerName(trainers.get(0).getName());
            }
        }

        return vo;
    }

    /** 回填讲师名称 */
    private void fillTrainerName(CourseDetailVO vo, Integer trainerId) {
        List<Trainer> trainers = trainerService.findByIds(Set.of(trainerId));
        if (!trainers.isEmpty()) {
            vo.setTrainerName(trainers.get(0).getName());
        }
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
}
