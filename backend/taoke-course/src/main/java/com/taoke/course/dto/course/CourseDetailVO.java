package com.taoke.course.dto.course;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 课程详情（含开课计划、分类名、发布者信息）
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Data
public class CourseDetailVO {

    private Integer id;
    private String title;
    private String type;
    private String typeLabel;

    private Integer publisherId;
    private String publisherType;
    private String publisherName;

    private Integer categoryId;
    private String categoryName;
    private Integer subCategoryId;
    private String subCategoryName;

    private String coverUrl;
    private String intro;
    private String summary;
    private String syllabus;
    private String materialUrl;
    private String materialText;
    private String audience;
    private String highlights;

    private Integer durationDays;
    private BigDecimal totalHours;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String keywords;
    private String seoDescription;

    private Integer trainerId;
    private String trainerName;

    private Integer isFeatured;
    private Integer isFree;
    private Integer hasPlan;
    private Integer status;
    private String statusLabel;
    private String rejectReason;

    private Integer sortOrder;
    private Integer viewCount;
    private Integer enrollmentCount;
    private BigDecimal score;

    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 公开课开课计划 */
    private List<CoursePlanDTO> plans;

    /** 线下公开课结束日期 */
    private LocalDate courseOpenEndDate;

    /** 到期是否前台自动隐藏：1=是 0=否 */
    private Integer isExpireHide;

    /** 是否已过期（线下公开课且结束日期早于今日） */
    private Boolean isOverdue;

    /**
     * 对外展示的课程编号（纯数字）：优先开课场次 legacy {@code sort_order}，否则 {@code courses.id}。
     */
    private Integer displayCourseNo;
}
