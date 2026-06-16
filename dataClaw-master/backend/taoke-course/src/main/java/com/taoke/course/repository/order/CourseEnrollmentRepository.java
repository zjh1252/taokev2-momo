package com.taoke.course.repository.order;

import com.taoke.course.entity.order.CourseEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 公开课报名记录持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Integer> {

    Optional<CourseEnrollment> findByCourseIdAndUserId(Integer courseId, Integer userId);

    boolean existsByCourseIdAndUserIdAndStatus(Integer courseId, Integer userId, Integer status);

    /** 按 userId 分页查报名记录（有效的），报名时间倒序 */
    Page<CourseEnrollment> findByUserIdAndStatusOrderByEnrolledAtDesc(Integer userId, Integer status, Pageable pageable);
}
