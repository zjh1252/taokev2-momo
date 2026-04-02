package com.taoke.course.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.*;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.course.mapper.CourseMapper;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Trainer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

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

    // ==================== C 端发布者操作 ====================

    @Transactional
    @Override
    public CourseDetailVO create(Integer publisherId, String publisherType, SaveCourseRequest request) {
        CourseType type = parseCourseType(request.getType());
        validatePublisherType(publisherType, type);
        validatePlans(type, request.getPlans());

        Course course = new Course();
        applyRequest(course, request, type);
        course.setPublisherId(publisherId);
        course.setPublisherType(publisherType);
        course.setStatus(CourseStatus.DRAFT.getValue());

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

        CourseType type = parseCourseType(request.getType());
        validatePublisherType(course.getPublisherType(), type);
        validatePlans(type, request.getPlans());

        applyRequest(course, request, type);
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
    public PageResponse<CourseListItemVO> listPublic(Integer categoryId, Integer subCategoryId,
                                                      String type, Boolean isOpen, String keyword,
                                                      String sortBy, int page, int size) {
        Specification<Course> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), CourseStatus.PUBLISHED.getValue()));

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (subCategoryId != null) {
                predicates.add(cb.equal(root.get("subCategoryId"), subCategoryId));
            }
            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(root.get("type"), CourseType.valueOf(type)));
            } else if (isOpen != null) {
                if (isOpen) {
                    predicates.add(root.get("type").in(CourseType.OPEN_OFFLINE, CourseType.OPEN_ONLINE));
                } else {
                    predicates.add(cb.equal(root.get("type"), CourseType.INTERNAL));
                }
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

        Sort sort = resolvePublicSort(sortBy);
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Page<Course> coursePage = courseRepository.findAll(spec, pageable);

        if (coursePage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<CourseListItemVO> items = coursePage.getContent().stream()
                .map(this::toListItemVO)
                .toList();
        return PageResponse.of(items, coursePage.getTotalElements(), page, size);
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

    /** 获取发布者拥有的课程，不存在或非本人则抛异常 */
    private Course getOwnedCourse(Integer courseId, Integer publisherId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
        if (!course.getPublisherId().equals(publisherId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作此课程");
        }
        return course;
    }

    /** 仅草稿/驳回状态可编辑 */
    private void assertEditable(Course course) {
        int status = course.getStatus();
        if (status != CourseStatus.DRAFT.getValue() && status != CourseStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的课程可编辑");
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
}
