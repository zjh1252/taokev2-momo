package com.taoke.course.repository;

import com.taoke.course.entity.Course;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
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
                AND NOT (
                    c.type = 'OPEN_OFFLINE'
                    AND c.is_expire_hide = 1
                    AND c.course_open_end_date IS NOT NULL
                    AND c.course_open_end_date < CURDATE()
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
                AND NOT (
                    c.type = 'OPEN_OFFLINE'
                    AND c.is_expire_hide = 1
                    AND c.course_open_end_date IS NOT NULL
                    AND c.course_open_end_date < CURDATE()
                )
            INNER JOIN course_plans cp ON cp.course_id = c.id AND cp.city_id IN (:cityIds)
            WHERE sc.type = 'COURSE_CATEGORY'
              AND sc.level = 1
              AND sc.is_visible = 1
            GROUP BY sc.id
            """, nativeQuery = true)
    List<Object[]> countPublishedOpenByCategoryL1AndCityIds(@Param("cityIds") Collection<Integer> cityIds);

    /** 已上架线下公开课：到期且开启自动隐藏（定时任务日志用） */
    @Query("""
            SELECT c.id FROM Course c
            WHERE c.status = 2
            AND c.type = com.taoke.course.enums.CourseType.OPEN_OFFLINE
            AND c.isExpireHide = 1
            AND c.courseOpenEndDate IS NOT NULL
            AND c.courseOpenEndDate < :today
            """)
    List<Integer> findExpiredHideCandidateIds(@Param("today") LocalDate today);

    /** 最近 N 天有上架课程的机构发布者 userId（按最近发课时间降序） */
    @Query(value = """
            SELECT c.publisher_id
            FROM courses c
            WHERE c.publisher_type = 'INSTITUTION'
              AND c.status = 2
              AND c.created_at >= :since
            GROUP BY c.publisher_id
            ORDER BY MAX(c.created_at) DESC
            """, nativeQuery = true)
    List<Integer> findRecentlyActiveInstitutionUserIds(@Param("since") LocalDateTime since, Pageable pageable);

    /** 已上架课程按专家 ID 批量计数 */
    @Query("""
            SELECT c.trainerId, COUNT(c)
            FROM Course c
            WHERE c.status = 2 AND c.trainerId IN :trainerIds
            GROUP BY c.trainerId
            """)
    List<Object[]> countPublishedGroupByTrainerIds(@Param("trainerIds") Collection<Integer> trainerIds);

    /** 已上架课程标题（按浏览量降序，供列表批量拉取后在内存分组截断） */
    @Query("""
            SELECT c.trainerId, c.title
            FROM Course c
            WHERE c.status = 2 AND c.trainerId IN :trainerIds
            ORDER BY c.viewCount DESC, c.id DESC
            """)
    List<Object[]> findPublishedTitlesByTrainerIds(@Param("trainerIds") Collection<Integer> trainerIds);
}
