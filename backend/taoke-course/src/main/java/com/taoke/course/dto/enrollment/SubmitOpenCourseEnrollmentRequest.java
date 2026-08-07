package com.taoke.course.dto.enrollment;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * C 端提交公开课报名
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:15
 */
@Data
public class SubmitOpenCourseEnrollmentRequest {

    @NotBlank(message = "请填写真实姓名")
    private String realName;

    @NotBlank(message = "请填写公司名称")
    private String companyName;

    @NotBlank(message = "请填写电子邮件")
    @Email(message = "电子邮件格式不正确")
    private String email;

    /** 公司电话（与 mobile 二选一） */
    private String companyPhone;

    /** 手机号码（与 companyPhone 二选一） */
    private String mobile;

    @NotNull(message = "课程 ID 不能为空")
    private Integer courseId;

    @NotNull(message = "开课计划 ID 不能为空")
    private Integer planId;
}
