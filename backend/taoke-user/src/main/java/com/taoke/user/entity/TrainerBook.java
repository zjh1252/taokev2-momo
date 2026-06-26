package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDate;

/**
 * 专家著作实体（无审核流程，专家本人直接维护）
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:30
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "user_trainer_books")
public class TrainerBook extends BaseEntity {

    /** 关联 user_trainers.id */
    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 书名 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 专家/作者展示名 */
    @Column(name = "author_name", length = 200)
    private String authorName;

    /** 提交著作的用户 ID */
    @Column(name = "submitter_user_id")
    private Integer submitterUserId;

    /** 封面图 URL */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 出版社 */
    @Column(name = "publisher", length = 200)
    private String publisher;

    /** 出版日期 */
    @Column(name = "publish_date")
    private LocalDate publishDate;

    /** 简介 */
    @Column(name = "description", length = 1000)
    private String description;

    /** 购买链接 */
    @Column(name = "buy_url", length = 500)
    private String buyUrl;

    /** 排序值，越大越靠前 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 审核状态：0=待审核, 1=已通过, 2=已驳回 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status = 1;

    /** 驳回原因 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 审核人 ID */
    @Column(name = "reviewer_id")
    private Integer reviewerId;

    /** 审核时间 */
    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;
}
