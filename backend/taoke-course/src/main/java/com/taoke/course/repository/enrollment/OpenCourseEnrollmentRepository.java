package com.taoke.course.repository.enrollment;

import com.taoke.course.entity.enrollment.OpenCourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * 公开课报名线索仓储
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:15
 */
public interface OpenCourseEnrollmentRepository
        extends JpaRepository<OpenCourseEnrollment, Integer>,
        JpaSpecificationExecutor<OpenCourseEnrollment> {
}
