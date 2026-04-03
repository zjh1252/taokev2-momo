package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台排课计划列表项 VO（包含关联课程信息）
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:00
 */
@Data
public class AdminCoursePlanVO {

    private Integer id;

    /** 关联课程信息 */
    private Integer courseId;
    private String courseTitle;
    private String courseType;
    private String courseTypeLabel;

    /** 排课时间 */
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    /** 地点信息 */
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private String address;
    private String onlineUrl;

    private Integer sortOrder;
    private LocalDateTime createdAt;
}
