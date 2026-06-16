package com.taoke.course.repository;

import com.taoke.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * 课程持久化
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
public interface CourseRepository extends JpaRepository<Course, Integer>, JpaSpecificationExecutor<Course> {

    long countByPublisherId(Integer publisherId);

    @Query("SELECT c.publisherId, COUNT(c) FROM Course c WHERE c.publisherId IN :ids GROUP BY c.publisherId")
    List<Object[]> countGroupByPublisherIds(@Param("ids") Collection<Integer> ids);

    long countByCreatedAtAfter(LocalDateTime time);

    /** 已上架课程按一级分类批量计数（不含开课城市过滤） */
    @Query(value = """
            SELECT sc.id AS category_id, COUNT(DISTINCT c.id) AS cnt
            FROM sys_categories sc
            LEFT JOIN sys_categories sc2 ON sc2.parent_id = sc.id AND sc2.type = 'COURSE_CATEGORY'
            LEFT JOIN courses c ON c.status = 2
                AND (
                    (:openOnly = 1 AND c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE'))
                    OR (:openOnly = 0 AND c.type = 'INTERNAL')
                )
                AND (
                    c.category_id = sc.id
                    OR c.sub_category_id = sc.id
                    OR c.sub_category_id = sc2.id
                )
            WHERE sc.type = 'COURSE_CATEGORY'
              AND sc.level = 1
              AND sc.is_visible = 1
            GROUP BY sc.id
            """, nativeQuery = true)
    List<Object[]> countPublishedByCategoryL1(@Param("openOnly") int openOnly);

    /** 已上架公开课按一级分类 + 开课城市批量计数 */
    @Query(value = """
            SELECT sc.id AS category_id, COUNT(DISTINCT c.id) AS cnt
            FROM sys_categories sc
            LEFT JOIN sys_categories sc2 ON sc2.parent_id = sc.id AND sc2.type = 'COURSE_CATEGORY'
            LEFT JOIN courses c ON c.status = 2
                AND c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE')
                AND (
                    c.category_id = sc.id
                    OR c.sub_category_id = sc.id
                    OR c.sub_category_id = sc2.id
                )
            INNER JOIN course_plans cp ON cp.course_id = c.id AND cp.city_id IN (:cityIds)
            WHERE sc.type = 'COURSE_CATEGORY'
              AND sc.level = 1
              AND sc.is_visible = 1
            GROUP BY sc.id
            """, nativeQuery = true)
    List<Object[]> countPublishedOpenByCategoryL1AndCityIds(@Param("cityIds") Collection<Integer> cityIds);

    /** 已上架公开课：全部开课计划均已结束 */
    @Query("""
            SELECT c.id FROM Course c
            WHERE c.status = 2
            AND c.type IN (com.taoke.course.enums.CourseType.OPEN_OFFLINE, com.taoke.course.enums.CourseType.OPEN_ONLINE)
            AND EXISTS (SELECT 1 FROM CoursePlan p WHERE p.courseId = c.id)
            AND NOT EXISTS (SELECT 1 FROM CoursePlan p WHERE p.courseId = c.id AND p.endTime >= :now)
            """)
    List<Integer> findExpiredPublishedOpenCourseIds(@Param("now") LocalDateTime now);
}
