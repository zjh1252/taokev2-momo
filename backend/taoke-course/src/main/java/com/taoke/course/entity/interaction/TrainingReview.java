package com.taoke.course.entity.interaction;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 培训评价实体 — 对应 training_reviews 表
 * <p>
 * 对齐旧站 tk_comment_course 核心字段：三维星级（授课内容/授课水平/服务态度）、
 * 文字评价、图片、培训信息快照等。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "training_reviews")
public class TrainingReview extends BaseEntity {

    /** 评价范围：COURSE / TRAINER / INSTITUTION */
    @Column(name = "review_scope", nullable = false, length = 32)
    private String reviewScope;

    /** 被评课程 ID（可空） */
    @Column(name = "course_id")
    private Integer courseId;

    /** 被评专家 user_id（可空） */
    @Column(name = "trainer_user_id")
    private Integer trainerUserId;

    /** 被评机构 ID（review_scope=INSTITUTION 时必填，关联 user_institutions.id） */
    @Column(name = "institution_id")
    private Integer institutionId;

    /** 被评案例 ID（review_scope=CASE 时必填） */
    @Column(name = "case_id")
    private Integer caseId;

    /** 关联订单 ID（MVP 阶段可为空） */
    @Column(name = "order_id")
    private Integer orderId;

    /** 专家姓名冗余快照 */
    @Column(name = "expert_name", length = 100)
    private String expertName;

    /** 培训/出场日期 */
    @Column(name = "training_date")
    private LocalDate trainingDate;

    /** 课程天数/出场天数 */
    @Column(name = "course_days", precision = 4, scale = 1)
    private BigDecimal courseDays;

    /** 课程标题/培训主题 */
    @Column(name = "course_title", length = 200)
    private String courseTitle;

    /** 甲方企业名称 */
    @Column(name = "client_company", length = 200)
    private String clientCompany;

    /** 培训地点 */
    @Column(name = "training_location", length = 200)
    private String trainingLocation;

    /** 授课内容评分 1-5 */
    @Column(name = "rating_content", nullable = false, columnDefinition = "tinyint(2)")
    private Integer ratingContent = 0;

    /** 授课水平评分 1-5 */
    @Column(name = "rating_teaching", nullable = false, columnDefinition = "tinyint(2)")
    private Integer ratingTeaching = 0;

    /** 服务态度评分 1-5 */
    @Column(name = "rating_service", nullable = false, columnDefinition = "tinyint(2)")
    private Integer ratingService = 0;

    /** 三维平均分 */
    @Column(name = "avg_score", nullable = false, precision = 3, scale = 2)
    private BigDecimal avgScore = BigDecimal.ZERO;

    /** 文字评价（>=20 字） */
    @Column(name = "comment_text", nullable = false, columnDefinition = "text")
    private String commentText;

    /** 图片 URL JSON 数组 */
    @Column(name = "photo_urls", columnDefinition = "json")
    private String photoUrls;

    /** 评价者姓名 */
    @Column(name = "submitter_name", length = 50)
    private String submitterName;

    /** 专家电话/微信（选填） */
    @Column(name = "submitter_contact", length = 50)
    private String submitterContact;

    /** 提交人用户 ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 审核状态：0=待审核 1=通过 -1=驳回 2=隐藏 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status = 0;

    /** 驳回理由 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 审核人用户 ID */
    @Column(name = "reviewed_by")
    private Integer reviewedBy;

    /** 审核时间 */
    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    /** 是否匿名 */
    @Column(name = "anonymous", nullable = false, columnDefinition = "tinyint(1)")
    private Boolean anonymous = false;
}
