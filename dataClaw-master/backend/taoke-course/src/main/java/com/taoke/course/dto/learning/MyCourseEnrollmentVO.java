package com.taoke.course.dto.learning;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 我的公开课报名项 VO — 用于"我的学习 / 公开课"列表
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:30
 */
@Data
public class MyCourseEnrollmentVO {

    /** 公开课 ID */
    private Integer courseId;

    /** 课程标题 */
    private String title;

    /** 封面图 URL */
    private String coverUrl;

    /** 课程类型：OPEN_OFFLINE / OPEN_ONLINE */
    private String type;

    /** 类型标签：线下公开课 / 线上公开课 */
    private String typeLabel;

    /** 讲师名 */
    private String trainerName;

    /** 实付金额 */
    private BigDecimal pricePaid;

    /** 报名时间 */
    private LocalDateTime enrolledAt;

    /** 过期时间 */
    private LocalDateTime expiredAt;

    /** 报名状态：1=有效 0=已取消 */
    private Integer status;

    /** 最近一期计划开始时间 */
    private LocalDateTime planStartTime;

    /** 最近一期计划结束时间 */
    private LocalDateTime planEndTime;

    /** 开课城市（反查地区名） */
    private String planCity;

    /** 具体地址 */
    private String planAddress;
}
