package com.taoke.course.dto.enrollment;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 公开课报名列表/详情 VO（管理端）
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:15
 */
@Data
public class OpenCourseEnrollmentVO {

    private Integer id;
    private Integer userId;
    private Integer courseId;
    private Integer planId;
    private String realName;
    private String companyName;
    private String email;
    private String companyPhone;
    private String mobile;
    /** 展示用关联课程名；课程已删时为「课程已删除」 */
    private String courseTitle;
    private Boolean courseDeleted;
    private LocalDateTime planStartTime;
    private LocalDateTime planEndTime;
    private Integer status;
    private String statusLabel;
    private String adminRemark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
