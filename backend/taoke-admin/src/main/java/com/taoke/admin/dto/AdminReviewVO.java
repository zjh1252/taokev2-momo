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
    /** 驳回理由 */
    private String rejectReason;
    /** 提交人联系方式（管理端可见） */
    private String submitterContact;
}
