package com.taoke.course.support;

import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseType;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * 线下公开课到期隐藏规则 — 前后端统一判断逻辑。
 *
 * @author Fangxinxin
 * @date 2026-06-18 10:00
 */
public final class OpenCourseExpireSupport {

    private OpenCourseExpireSupport() {
    }

    /** 是否已过期（仅线下公开课，结束日期早于今日） */
    public static boolean isOverdue(Course course, LocalDate today) {
        if (course == null || course.getType() != CourseType.OPEN_OFFLINE) {
            return false;
        }
        LocalDate endDate = course.getCourseOpenEndDate();
        return endDate != null && endDate.isBefore(today);
    }

    public static boolean isOverdue(Course course) {
        return isOverdue(course, LocalDate.now());
    }

    /** 前台列表/搜索是否应隐藏 */
    public static boolean shouldHideFromPublic(Course course, LocalDate today) {
        if (course == null) {
            return true;
        }
        return isOverdue(course, today) && Objects.equals(course.getIsExpireHide(), 1);
    }

    public static boolean shouldHideFromPublic(Course course) {
        return shouldHideFromPublic(course, LocalDate.now());
    }

    /** 前台公开列表 Specification 追加条件：排除到期且开启自动隐藏的线下公开课 */
    public static Predicate publicVisiblePredicate(Root<Course> root, CriteriaBuilder cb, LocalDate today) {
        return cb.or(
                cb.notEqual(root.get("type"), CourseType.OPEN_OFFLINE),
                cb.isNull(root.get("courseOpenEndDate")),
                cb.greaterThanOrEqualTo(root.get("courseOpenEndDate"), today),
                cb.equal(root.get("isExpireHide"), 0)
        );
    }

    /** 从开课计划同步线下公开课结束日期（取最晚场次 end_time 的日期） */
    public static LocalDate resolveOpenEndDate(List<CoursePlan> plans) {
        if (plans == null || plans.isEmpty()) {
            return null;
        }
        return plans.stream()
                .map(CoursePlan::getEndTime)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }
}
