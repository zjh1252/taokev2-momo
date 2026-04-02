package com.taoke.course.entity;

import com.taoke.common.entity.BaseEntity;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 课程主表实体 — 对应 courses 表
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Getter
@Setter
@Entity
@Table(name = "courses")
public class Course extends BaseEntity {

    /** 课程标题 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 课程类型，默认内训课 */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 16)
    private CourseType type = CourseType.INTERNAL;

    /** 发布者 ID（用户 ID） */
    @Column(name = "publisher_id", nullable = false)
    private Integer publisherId;

    /** 发布者类型：TRAINER / INSTITUTION */
    @Column(name = "publisher_type", nullable = false, length = 20)
    private String publisherType;

    /** 一级分类 ID */
    @Column(name = "category_id")
    private Integer categoryId = 0;

    /** 二级分类 ID */
    @Column(name = "sub_category_id")
    private Integer subCategoryId = 0;

    /** 课程封面 URL */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 课程介绍（富文本 HTML） */
    @Column(name = "intro", columnDefinition = "longtext")
    private String intro;

    /** 课程大纲（富文本 HTML） */
    @Column(name = "syllabus", columnDefinition = "longtext")
    private String syllabus;

    /** 适用人群 */
    @Column(name = "audience", columnDefinition = "text")
    private String audience;

    /** 课程亮点/收益 */
    @Column(name = "highlights", columnDefinition = "text")
    private String highlights;

    /** 课程天数 */
    @Column(name = "duration_days")
    private Integer durationDays = 0;

    /** 每天课时（小时/天） */
    @Column(name = "hours_per_day", precision = 4, scale = 1)
    private BigDecimal hoursPerDay = BigDecimal.ZERO;

    /** 课程价格 */
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    /** 原价（划线价） */
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice = BigDecimal.ZERO;

    /** 关键词，逗号分隔 */
    @Column(name = "keywords", length = 500)
    private String keywords;

    /** 关联讲师 ID */
    @Column(name = "trainer_id")
    private Integer trainerId = 0;

    /** 是否主打课程：0=否 1=是 */
    @Column(name = "is_featured", nullable = false, columnDefinition = "tinyint")
    private Integer isFeatured = 0;

    /** 是否免费：0=否 1=是 */
    @Column(name = "is_free", nullable = false, columnDefinition = "tinyint")
    private Integer isFree = 0;

    /** 状态：0=草稿 1=待审核 2=已上架 3=驳回 4=已下架 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = CourseStatus.DRAFT.getValue();

    /** 驳回原因 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 排序权重 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 浏览量 */
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    /** 报名人数 */
    @Column(name = "enrollment_count", nullable = false)
    private Integer enrollmentCount = 0;

    /** 综合评分 */
    @Column(name = "score", nullable = false, precision = 3, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    /** 上线时间 */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
