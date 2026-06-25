package com.taoke.admin.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台课程列表项 VO
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Data
public class AdminCourseVO {

    private Integer id;
    private String title;
    private String type;
    private String typeLabel;
    private String coverUrl;

    private Integer publisherId;
    private String publisherType;
    /** 发布方展示：角色 + 姓名，如「专家：王五」 */
    private String publisherDisplayName;

    private Integer categoryId;
    private String categoryName;

    private Integer durationDays;
    private BigDecimal price;

    private Integer isFeatured;
    private Integer isFree;
    private Integer status;
    private String statusLabel;

    private Integer viewCount;
    private Integer enrollmentCount;

    private String trainerName;

    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    /** 线下公开课结束日期 */
    private LocalDate courseOpenEndDate;

    /** 到期是否前台自动隐藏：1=是 0=否 */
    private Integer isExpireHide;

    /** 是否已过期（线下公开课且结束日期早于今日） */
    private Boolean isOverdue;
}
