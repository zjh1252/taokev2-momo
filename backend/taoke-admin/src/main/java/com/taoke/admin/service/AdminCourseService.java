package com.taoke.admin.service;

import com.taoke.admin.dto.AdminCoursePlanQuery;
import com.taoke.admin.dto.AdminCoursePlanVO;
import com.taoke.admin.dto.AdminCourseQuery;
import com.taoke.admin.dto.AdminCourseVO;
import com.taoke.common.dto.PageResult;
import com.taoke.common.service.CategoryService;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
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

    /**
     * 分页查询课程列表
     */
    public PageResult<AdminCourseVO> listCourses(AdminCourseQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        java.util.Collection<Integer> publisherUserIds = resolvePublisherUserIds(query.getPublisherName());

        Page<Course> page = courseService.searchForAdmin(
                query.getKeyword(), query.getStatus(), query.getType(),
                query.getTrainerId(), query.getPublisherType(), query.getPublisherId(),
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
        Set<Integer> trainerIds = courses.stream()
                .map(Course::getTrainerId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, Trainer> trainerMap = trainerIds.isEmpty()
                ? Map.of()
                : trainerService.findByIds(trainerIds).stream()
                        .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        List<AdminCourseVO> voList = courses.stream().map(course -> {
            AdminCourseVO vo = new AdminCourseVO();
            vo.setId(course.getId());
            vo.setTitle(course.getTitle());
            vo.setType(course.getType().name());
            vo.setTypeLabel(course.getType().getLabel());
            vo.setCoverUrl(course.getCoverUrl());
            vo.setPublisherId(course.getPublisherId());
            vo.setPublisherType(course.getPublisherType());
            vo.setCategoryId(course.getCategoryId());
            vo.setCategoryName(categoryNameMap.get(course.getCategoryId()));
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

            Trainer trainer = trainerMap.get(course.getTrainerId());
            if (trainer != null) {
                vo.setTrainerName(trainer.getName());
            }

            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
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
}
