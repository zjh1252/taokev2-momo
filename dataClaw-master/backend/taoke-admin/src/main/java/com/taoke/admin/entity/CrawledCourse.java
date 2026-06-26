package com.taoke.admin.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;

/**
 * 爬取课程数据中间表实体 — 对应 crawled_courses 表。
 * <p>
 * 存储从外部网站爬取的课程信息，管理员审核后导入 courses 正式表。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "crawled_courses")
public class CrawledCourse extends BaseEntity {

    // ==================== 来源信息 ====================

    /** 数据来源站点标识 */
    @Column(name = "source", nullable = false, length = 50)
    private String source;

    /** 来源页面 URL */
    @Column(name = "source_url", nullable = false, length = 500)
    private String sourceUrl;

    /** 来源站点课程 ID（去重用） */
    @Column(name = "source_course_id", length = 100)
    private String sourceCourseId;

    // ==================== 核心信息（对齐 courses） ====================

    /** 课程标题 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 课程类型：OPEN_OFFLINE/OPEN_ONLINE/INTERNAL */
    @Column(name = "type", nullable = false, length = 16)
    private String type = "OPEN_OFFLINE";

    /** 一级分类 ID（需管理员映射） */
    @Column(name = "category_id")
    private Integer categoryId = 0;

    /** 二级分类 ID */
    @Column(name = "sub_category_id")
    private Integer subCategoryId = 0;

    /** 来源站点的原始分类名（辅助映射） */
    @Column(name = "category_name_raw", length = 100)
    private String categoryNameRaw;

    /** 课程封面 URL */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 课程介绍（HTML） */
    @Column(name = "intro", columnDefinition = "longtext")
    private String intro;

    /** 课程简介（短文本） */
    @Column(name = "summary", length = 500)
    private String summary;

    /** 课程大纲（HTML） */
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

    /** 总时长（小时） */
    @Column(name = "total_hours", precision = 5, scale = 1)
    private BigDecimal totalHours = BigDecimal.ZERO;

    /** 价格 */
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    /** 原价 */
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice = BigDecimal.ZERO;

    /** 关键词 */
    @Column(name = "keywords", length = 500)
    private String keywords;

    /** 来源站讲师名称（辅助关联） */
    @Column(name = "trainer_name_raw", length = 100)
    private String trainerNameRaw;

    // ==================== JSON 子数据 ====================

    /** 排课计划 JSON */
    @Column(name = "plans_json", columnDefinition = "json")
    private String plansJson;

    /** 评价 JSON */
    @Column(name = "evaluation_json", columnDefinition = "json")
    private String evaluationJson;

    /** 适宜学员 */
    @Column(name = "target_audience", columnDefinition = "text")
    private String targetAudience;

    /** 学习收益 */
    @Column(name = "learning_outcomes", columnDefinition = "text")
    private String learningOutcomes;

    /** 内训课服务内容 JSON */
    @Column(name = "services_json", columnDefinition = "json")
    private String servicesJson;

    // ==================== 去重 ====================

    /** 去重状态：0=未检查 1=无重复 2=有疑似重复 3=确认重复 */
    @Column(name = "dedup_status", nullable = false, columnDefinition = "tinyint")
    private Integer dedupStatus = 0;

    /** 疑似/确认重复的 courses.id */
    @Column(name = "dedup_course_id")
    private Integer dedupCourseId;

    /** 去重判定原因 */
    @Column(name = "dedup_reason", length = 255)
    private String dedupReason;

    // ==================== 审核 ====================

    /** 审核状态：0=待审核 1=已通过 2=已驳回 3=已入库 */
    @Column(name = "review_status", nullable = false, columnDefinition = "tinyint")
    private Integer reviewStatus = 0;

    /** 驳回原因 */
    @Column(name = "review_reject_reason", length = 500)
    private String reviewRejectReason;

    /** 审核时间 */
    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    /** 审核通过后导入的 courses.id */
    @Column(name = "imported_course_id")
    private Integer importedCourseId;

    // ==================== 原始数据 ====================

    /** 原始页面 HTML */
    @Column(name = "raw_html", columnDefinition = "longtext")
    private String rawHtml;

    /** 爬虫原始输出 JSON */
    @Column(name = "raw_json", columnDefinition = "json")
    private String rawJson;
}
