package com.taoke.course.repository;

import com.taoke.course.entity.CoursePlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 公开课开课计划持久化
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
public interface CoursePlanRepository extends JpaRepository<CoursePlan, Integer> {

    List<CoursePlan> findByCourseIdOrderBySortOrder(Integer courseId);

    List<CoursePlan> findByCourseIdInOrderBySortOrder(List<Integer> courseIds);

    void deleteByCourseId(Integer courseId);
}
