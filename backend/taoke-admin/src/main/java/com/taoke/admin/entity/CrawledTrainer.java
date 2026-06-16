package com.taoke.admin.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 爬取专家数据中间表实体 — 对应 crawled_trainers 表。
 * <p>
 * 存储从外部网站爬取的专家信息，管理员审核后导入 user_trainers 正式表。
 * 关联的教育经历、荣誉、著作、案例等以 JSON 格式存储在本表，
 * 审核通过后拆分到对应的子表。
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
@Table(name = "crawled_trainers")
public class CrawledTrainer extends BaseEntity {

    // ==================== 来源信息 ====================

    /** 数据来源站点标识，如 jiangshibao/huashi123 */
    @Column(name = "source", nullable = false, length = 50)
    private String source;

    /** 来源页面 URL */
    @Column(name = "source_url", nullable = false, length = 500)
    private String sourceUrl;

    /** 来源站点的讲师 ID/URL slug（去重用） */
    @Column(name = "source_trainer_id", length = 100)
    private String sourceTrainerId;

    // ==================== 核心信息（对齐 user_trainers） ====================

    /** 讲师姓名 */
    @Column(name = "name", length = 100)
    private String name;

    /** 授课姓名 */
    @Column(name = "teaching_name", length = 64)
    private String teachingName;

    /** 头像 URL */
    @Column(name = "avatar", length = 500)
    private String avatar;

    /** 头衔 */
    @Column(name = "title", length = 64)
    private String title;

    /** 性别：0=未知 1=男 2=女 */
    @Column(name = "gender", columnDefinition = "tinyint")
    private Integer gender = 0;

    /** 一句话介绍 */
    @Column(name = "one_line_intro", length = 255)
    private String oneLineIntro;

    /** 个人简介 */
    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    /** 详细介绍（HTML/富文本） */
    @Column(name = "intro", columnDefinition = "longtext")
    private String intro;

    /** 从业经历 */
    @Column(name = "background", columnDefinition = "text")
    private String background;

    /** 专长描述 */
    @Column(name = "good_at", columnDefinition = "text")
    private String goodAt;

    /** 擅长领域 JSON 数组 */
    @Column(name = "specialties", length = 512)
    private String specialties;

    /** 擅长标签，逗号分隔 */
    @Column(name = "expertise_tags", length = 500)
    private String expertiseTags;

    /** 授课风格 */
    @Column(name = "teaching_style", length = 500)
    private String teachingStyle;

    /** 从业年限 */
    @Column(name = "experience_years")
    private Integer experienceYears;

    /** 培训年限 */
    @Column(name = "teaching_years")
    private Integer teachingYears;

    /** 驻地省份 ID */
    @Column(name = "province_id")
    private Integer provinceId = 0;

    /** 驻地城市 ID */
    @Column(name = "city_id")
    private Integer cityId = 0;

    /** 部分客户 */
    @Column(name = "partial_clients", columnDefinition = "text")
    private String partialClients;

    // ==================== JSON 子数据 ====================

    /** 教育经历 JSON */
    @Column(name = "education_json", columnDefinition = "json")
    private String educationJson;

    /** 工作经历 JSON */
    @Column(name = "experience_json", columnDefinition = "json")
    private String experienceJson;

    /** 荣誉资质 JSON */
    @Column(name = "honors_json", columnDefinition = "json")
    private String honorsJson;

    /** 著作 JSON */
    @Column(name = "books_json", columnDefinition = "json")
    private String booksJson;

    /** 主讲课程 JSON */
    @Column(name = "courses_json", columnDefinition = "json")
    private String coursesJson;

    /** 案例 JSON */
    @Column(name = "cases_json", columnDefinition = "json")
    private String casesJson;

    /** 评价 JSON */
    @Column(name = "evaluation_json", columnDefinition = "json")
    private String evaluationJson;

    // ==================== 去重 ====================

    /** 去重状态：0=未检查 1=无重复 2=有疑似重复 3=确认重复 */
    @Column(name = "dedup_status", nullable = false, columnDefinition = "tinyint")
    private Integer dedupStatus = 0;

    /** 疑似/确认重复的 user_trainers.id */
    @Column(name = "dedup_trainer_id")
    private Integer dedupTrainerId;

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

    /** 审核通过后导入的 user_trainers.id */
    @Column(name = "imported_trainer_id")
    private Integer importedTrainerId;

    // ==================== 原始数据 ====================

    /** 原始页面 HTML */
    @Column(name = "raw_html", columnDefinition = "longtext")
    private String rawHtml;

    /** 爬虫原始输出 JSON */
    @Column(name = "raw_json", columnDefinition = "json")
    private String rawJson;
}
