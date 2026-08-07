package com.taoke.course.entity.enrollment;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 内训课报名线索 — 对应 internal_course_enrollments 表
 *
 * @author Fangxinxin
 * @date 2026-08-07 10:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "internal_course_enrollments")
public class InternalCourseEnrollment extends BaseEntity {

    /** 提交人用户 ID（登录可选） */
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "real_name", nullable = false, length = 50)
    private String realName;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "company_phone", length = 30)
    private String companyPhone;

    @Column(name = "mobile", length = 20)
    private String mobile;

    /** 提交时冗余课程名称 */
    @Column(name = "course_title", nullable = false, length = 500)
    private String courseTitle = "";

    /** 0=待处理 1=已联系 2=已无效 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status = 0;

    @Column(name = "admin_remark", columnDefinition = "text")
    private String adminRemark;
}
