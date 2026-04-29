package com.taoke.course.dto.course;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 课程列表项（轻量化字段，用于分页列表展示）
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Data
public class CourseListItemVO {

    private Integer id;
    private String title;
    private String type;
    private String typeLabel;
    private String coverUrl;

    private Integer categoryId;
    private String categoryName;

    private Integer durationDays;
    private BigDecimal totalHours;
    private BigDecimal price;
    private BigDecimal originalPrice;

    private Integer isFeatured;
    private Integer isFree;
    private Integer status;
    private String statusLabel;

    private Integer viewCount;
    private Integer enrollmentCount;
    private BigDecimal score;

    private String publisherType;
    private String publisherName;
    private String trainerName;
    private String keywords;

    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    /** 最近一场开课时间（公开课列表展示用） */
    private LocalDateTime nextPlanStartDate;

    /** 最近一场开课城市名称（公开课列表展示用） */
    private String nextPlanCity;
}
