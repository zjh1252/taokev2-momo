package com.taoke.course.repository;

import com.taoke.course.entity.CoursePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 公开课开课计划持久化
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
public interface CoursePlanRepository extends JpaRepository<CoursePlan, Integer>,
        JpaSpecificationExecutor<CoursePlan> {

    List<CoursePlan> findByCourseIdOrderBySortOrder(Integer courseId);

    List<CoursePlan> findByCourseIdInOrderBySortOrder(List<Integer> courseIds);

    /**
     * 按老站场次 ID（迁移写入 sort_order）反查开课计划。
     * <p>用于公开课 SEO：{@code /opencourse/{legacyPlanId}.htm}。</p>
     */
    Optional<CoursePlan> findFirstBySortOrderOrderByIdAsc(Integer sortOrder);

    /**
     * 批量查询给定课程列表中 startTime &gt;= 指定时间的开课计划，按时间升序。
     * <p>用于公开课列表展示「最近一场」开课信息（取每课程的第一条即为最近一场）。</p>
     */
    List<CoursePlan> findByCourseIdInAndStartTimeGreaterThanEqualOrderByStartTimeAsc(
            Collection<Integer> courseIds, LocalDateTime threshold);

    /** 批量查询开课计划，按开课时间升序（列表展示取每场最近/将开一场） */
    List<CoursePlan> findByCourseIdInOrderByStartTimeAsc(Collection<Integer> courseIds);

    void deleteByCourseId(Integer courseId);
}
