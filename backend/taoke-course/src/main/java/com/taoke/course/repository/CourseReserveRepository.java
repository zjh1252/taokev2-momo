package com.taoke.course.repository;

import com.taoke.course.entity.CourseReserve;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 线上公开课预约记录持久化
 *
 * @author Fangxinxin
 * @date 2026-07-16 15:15
 */
public interface CourseReserveRepository extends JpaRepository<CourseReserve, Integer> {

    boolean existsByUserIdAndCourseIdAndReserveStatus(Integer userId, Integer courseId, Integer reserveStatus);

    Optional<CourseReserve> findByUserIdAndCourseIdAndReserveStatus(
            Integer userId, Integer courseId, Integer reserveStatus);
}
