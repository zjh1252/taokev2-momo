package com.taoke.course.repository.enrollment;

import com.taoke.course.entity.enrollment.InternalCourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * 内训课报名线索仓储
 *
 * @author Fangxinxin
 * @date 2026-08-07 10:00
 */
public interface InternalCourseEnrollmentRepository
        extends JpaRepository<InternalCourseEnrollment, Integer>,
        JpaSpecificationExecutor<InternalCourseEnrollment> {
}
