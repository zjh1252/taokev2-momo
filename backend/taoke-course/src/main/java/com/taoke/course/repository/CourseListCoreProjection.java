package com.taoke.course.repository;

import com.taoke.course.enums.CourseType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 公开列表轻量投影 — 不含 intro/syllabus/materialText 等大字段。
 *
 * @author Fangxinxin
 * @date 2026-07-15 17:30
 */
public interface CourseListCoreProjection {

    Integer getId();

    String getTitle();

    CourseType getType();

    String getCoverUrl();

    Integer getCategoryId();

    Integer getSubCategoryId();

    Integer getDurationDays();

    BigDecimal getTotalHours();

    BigDecimal getPrice();

    BigDecimal getOriginalPrice();

    Integer getIsFeatured();

    Integer getIsFree();

    Integer getStatus();

    Integer getViewCount();

    Integer getEnrollmentCount();

    BigDecimal getScore();

    String getPublisherType();

    Integer getPublisherId();

    Integer getTrainerId();

    String getKeywords();

    LocalDateTime getPublishedAt();

    LocalDateTime getCreatedAt();

    LocalDate getCourseOpenEndDate();

    Integer getIsExpireHide();

    Integer getSortOrder();
}
