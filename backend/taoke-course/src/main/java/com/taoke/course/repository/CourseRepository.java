package com.taoke.course.repository;

import com.taoke.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;

/**
 * 课程持久化
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
public interface CourseRepository extends JpaRepository<Course, Integer>, JpaSpecificationExecutor<Course> {

    long countByCreatedAtAfter(LocalDateTime time);
}
