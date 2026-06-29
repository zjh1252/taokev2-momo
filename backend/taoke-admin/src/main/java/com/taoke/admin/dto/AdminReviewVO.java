package com.taoke.admin.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 后台 — 培训评价列表项
 * <p>在 C 端 {@code ReviewVO} 字段基础上补充管理端所需信息。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 12:00
 */
@Data
public class AdminReviewVO {

    private Integer id;
    private String reviewScope;
    private Integer courseId;
    private Integer trainerUserId;
    private Integer institutionId;
    private Integer caseId;

    private String expertName;
    private LocalDate trainingDate;
    private BigDecimal courseDays;
    private String courseTitle;
    private String clientCompany;
    private String trainingLocation;

    private Integer ratingContent;
    private Integer ratingTeaching;
    private Integer ratingService;
    private BigDecimal avgScore;

    private String commentText;
    private List<String> photoUrls;

    private String submitterName;
    private Boolean anonymous;
    private Integer status;

    private LocalDateTime createdAt;

    /** 提交人用户 ID */
    private Integer userId;

    /** 审核操作人用户 ID */
    private Integer reviewedBy;
    /** 审核人展示名（昵称 / 真名 / 手机号） */
    private String reviewedByName;
    /** 驳回理由 */
    private String rejectReason;
    /** 提交人联系方式（管理端可见） */
    private String submitterContact;

    /**
     * 被评对象展示名（列表「关联对象」列）：课程标题 / 专家姓名 / 机构名称，
     * <p>优先评价快照字段，缺省时由后台按 ID 批量回填。</p>
     */
    private String targetDisplayName;
}
