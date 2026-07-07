package com.taoke.admin.service;

import com.taoke.admin.dto.AdminCoursePlanQuery;
import com.taoke.admin.dto.AdminCoursePlanVO;
import com.taoke.admin.dto.AdminCourseQuery;
import com.taoke.admin.dto.AdminCourseVO;
import com.taoke.common.dto.PageResult;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.course.support.OpenCourseExpireSupport;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台课程管理编排服务 — 列表查询 + 审核 + 管理操作。
 * <p>
 * 通过 {@code api/} 契约接口访问 taoke-course 能力，不直接依赖 Repository。
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Service
@RequiredArgsConstructor
public class AdminCourseService {

    private final CourseService courseService;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final CategoryService categoryService;
    private final UserService userService;
    private final OpsMaterialResolver opsMaterialResolver;

    /**
     * 分页查询课程列表
     */
    public PageResult<AdminCourseVO> listCourses(AdminCourseQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        java.util.Collection<Integer> publisherUserIds = resolvePublisherUserIds(query.getPublisherName());
        java.util.Collection<Integer> filterTrainerIds = resolveTrainerIds(query.getTrainerName());
        Integer trainerId = filterTrainerIds != null ? null : query.getTrainerId();

        Page<Course> page = courseService.searchForAdmin(
                query.getKeyword(), query.getStatus(), query.getType(),
                trainerId, filterTrainerIds, query.getPublisherType(), query.getPublisherId(),
                publisherUserIds,
                pageable);
        List<Course> courses = page.getContent();

        if (courses.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        // 批量获取分类名称
        Set<Integer> categoryIds = courses.stream()
                .map(Course::getCategoryId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, String> categoryNameMap = categoryIds.isEmpty()
                ? Map.of()
                : categoryService.getNameMap(categoryIds);

        // 批量获取讲师名称
        Set<Integer> courseTrainerIds = courses.stream()
                .map(Course::getTrainerId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, Trainer> trainerMap = courseTrainerIds.isEmpty()
                ? Map.of()
                : trainerService.findByIds(courseTrainerIds).stream()
                        .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        Set<Integer> publisherUserIdSet = courses.stream()
                .map(Course::getPublisherId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, User> publisherUserMap = publisherUserIdSet.isEmpty()
                ? Map.of()
                : userService.findAllByIds(new ArrayList<>(publisherUserIdSet)).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        List<AdminCourseVO> voList = courses.stream().map(course -> {
            AdminCourseVO vo = new AdminCourseVO();
            Trainer trainer = trainerMap.get(course.getTrainerId());
            vo.setId(course.getId());
            vo.setTitle(course.getTitle());
            vo.setType(course.getType().name());
            vo.setTypeLabel(course.getType().getLabel());
            String categoryName = categoryNameMap.get(course.getCategoryId());
            String trainerAvatar = trainer != null ? trainer.getAvatar() : null;
            vo.setCoverUrl(resolveCoverUrl(course, trainerAvatar, categoryName));
            vo.setPublisherId(course.getPublisherId());
            vo.setPublisherType(course.getPublisherType());
            vo.setPublisherDisplayName(formatPublisherDisplay(
                    course.getPublisherType(),
                    publisherUserMap.get(course.getPublisherId()),
                    trainer != null ? trainer.getName() : null));
            vo.setCategoryId(course.getCategoryId());
            vo.setCategoryName(categoryName);
            vo.setDurationDays(course.getDurationDays());
            vo.setPrice(course.getPrice());
            vo.setIsFeatured(course.getIsFeatured());
            vo.setIsFree(course.getIsFree());
            vo.setStatus(course.getStatus());
            vo.setStatusLabel(CourseStatus.of(course.getStatus()).getLabel());
            vo.setViewCount(course.getViewCount());
            vo.setEnrollmentCount(course.getEnrollmentCount());
            vo.setPublishedAt(course.getPublishedAt());
            vo.setCreatedAt(course.getCreatedAt());
            vo.setCourseOpenEndDate(course.getCourseOpenEndDate());
            vo.setIsExpireHide(course.getIsExpireHide());
            vo.setIsOverdue(OpenCourseExpireSupport.isOverdue(course));

            if (trainer != null) {
                vo.setTrainerName(trainer.getName());
            }

            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 按专家姓名解析 trainer_id 列表
     */
    private java.util.Collection<Integer> resolveTrainerIds(String trainerName) {
        if (trainerName == null || trainerName.isBlank()) {
            return null;
        }
        Page<Trainer> trainers = trainerService.searchForAdmin(trainerName.trim(), null,
                PageRequest.of(0, 50));
        List<Integer> ids = trainers.getContent().stream()
                .map(Trainer::getId)
                .filter(id -> id != null && id > 0)
                .toList();
        return ids.isEmpty() ? List.of(-1) : ids;
    }

    /**
     * 按专家/机构名称解析 publisher userId 列表
     */
    private java.util.Collection<Integer> resolvePublisherUserIds(String publisherName) {
        if (publisherName == null || publisherName.isBlank()) {
            return null;
        }
        String kw = publisherName.trim();
        java.util.Set<Integer> ids = new java.util.HashSet<>();
        Page<Trainer> trainers = trainerService.searchForAdmin(kw, null,
                PageRequest.of(0, 50));
        trainers.getContent().stream()
                .map(Trainer::getUserId)
                .filter(id -> id != null && id > 0)
                .forEach(ids::add);
        Page<Institution> insts = institutionService.searchForAdmin(kw, null,
                PageRequest.of(0, 50));
        insts.getContent().stream()
                .map(Institution::getUserId)
                .filter(id -> id != null && id > 0)
                .forEach(ids::add);
        if (ids.isEmpty()) {
            return java.util.List.of(-1);
        }
        return ids;
    }

    private static String formatPublisherDisplay(String publisherType, User user, String trainerName) {
        String roleLabel = publisherRoleLabel(publisherType);
        String name = null;
        if (trainerName != null && !trainerName.isBlank()) {
            name = trainerName.trim();
        }
        if (name == null && user != null) {
            name = user.getRealName();
            if (name == null || name.isBlank()) {
                name = user.getNickname();
            }
        }
        if (name == null || name.isBlank()) {
            return roleLabel;
        }
        return roleLabel + "：" + name;
    }

    private static String publisherRoleLabel(String publisherType) {
        if (publisherType == null || publisherType.isBlank()) {
            return "-";
        }
        return switch (publisherType) {
            case "TRAINER" -> "专家";
            case "ASSISTANT" -> "专家助理";
            case "AGENT" -> "专家经纪人";
            case "ENTERPRISE_AGENT" -> "专家经纪公司";
            case "INSTITUTION" -> "机构";
            case "INSTITUTION_EMPLOYEE" -> "机构员工";
            default -> publisherType;
        };
    }

    /**
     * 后台课程详情
     */
    public CourseDetailVO getDetail(Integer courseId) {
        return courseService.getDetailForAdmin(courseId);
    }

    /**
     * 审核通过
     */
    public void approve(Integer courseId) {
        courseService.approve(courseId);
    }

    /**
     * 驳回
     */
    public void reject(Integer courseId, String reason) {
        courseService.reject(courseId, reason);
    }

    /**
     * 后台下架
     */
    public void unpublish(Integer courseId) {
        courseService.adminUnpublish(courseId);
    }

    /**
     * 设为/取消主打课程
     */
    public void toggleFeatured(Integer courseId) {
        courseService.toggleFeatured(courseId);
    }

    /**
     * 批量更新「到期自动隐藏」开关
     */
    public void batchUpdateExpireHide(java.util.List<Integer> ids, Integer isExpireHide) {
        courseService.batchUpdateExpireHide(ids, isExpireHide);
    }

    /**
     * 分页查询排课计划（含关联课程信息）
     */
    public PageResult<AdminCoursePlanVO> listPlans(AdminCoursePlanQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "startTime")
        );

        Page<CoursePlan> page = courseService.searchPlansForAdmin(
                query.getCourseId(), query.getKeyword(), pageable);
        List<CoursePlan> plans = page.getContent();

        if (plans.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        // 批量获取关联课程
        Set<Integer> courseIds = plans.stream()
                .map(CoursePlan::getCourseId)
                .collect(Collectors.toSet());
        Map<Integer, Course> courseMap = courseService.findByIds(courseIds).stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));

        List<AdminCoursePlanVO> voList = plans.stream().map(plan -> {
            AdminCoursePlanVO vo = new AdminCoursePlanVO();
            vo.setId(plan.getId());
            vo.setCourseId(plan.getCourseId());
            vo.setStartTime(plan.getStartTime());
            vo.setEndTime(plan.getEndTime());
            vo.setProvinceId(plan.getProvinceId());
            vo.setCityId(plan.getCityId());
            vo.setDistrictId(plan.getDistrictId());
            vo.setAddress(plan.getAddress());
            vo.setOnlineUrl(plan.getOnlineUrl());
            vo.setSortOrder(plan.getSortOrder());
            vo.setCreatedAt(plan.getCreatedAt());

            Course course = courseMap.get(plan.getCourseId());
            if (course != null) {
                vo.setCourseTitle(course.getTitle());
                vo.setCourseType(course.getType().name());
                vo.setCourseTypeLabel(course.getType().getLabel());
            }

            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /** 解析列表展示用封面：自定义封面 &gt; 讲师头像 &gt; 默认封面素材池 */
    private String resolveCoverUrl(Course course, String trainerAvatar, String categoryName) {
        if (course == null) {
            return "";
        }
        String scene = resolveCoverMaterialScene(course.getType());
        int seed = course.getId() != null ? course.getId() : 0;
        return opsMaterialResolver.resolveCourseCoverUrl(
                course.getCoverUrl(), trainerAvatar, categoryName, scene, seed);
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
}
