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

    /**
     * 列表回表：只取展示所需列，避免 intro/syllabus/material_text 等 LONGTEXT。
     */
    @Query("""
            SELECT c.id AS id, c.title AS title, c.type AS type, c.coverUrl AS coverUrl,
                   c.categoryId AS categoryId, c.subCategoryId AS subCategoryId,
                   c.durationDays AS durationDays, c.totalHours AS totalHours,
                   c.price AS price, c.originalPrice AS originalPrice,
                   c.isFeatured AS isFeatured, c.isFree AS isFree, c.status AS status,
                   c.viewCount AS viewCount, c.enrollmentCount AS enrollmentCount, c.score AS score,
                   c.publisherType AS publisherType, c.publisherId AS publisherId,
                   c.trainerId AS trainerId, c.keywords AS keywords,
                   c.publishedAt AS publishedAt, c.createdAt AS createdAt,
                   c.courseOpenEndDate AS courseOpenEndDate, c.isExpireHide AS isExpireHide,
                   c.sortOrder AS sortOrder
            FROM Course c
            WHERE c.id IN :ids
            """)
    List<CourseListCoreProjection> findListCoreByIdIn(@Param("ids") Collection<Integer> ids);

    @Query("SELECT c.publisherId, COUNT(c) FROM Course c WHERE c.publisherId IN :ids GROUP BY c.publisherId")
    List<Object[]> countGroupByPublisherIds(@Param("ids") Collection<Integer> ids);

    long countByCreatedAtAfter(LocalDateTime time);

    /** 已上架课程按一级分类批量计数（不含开课城市过滤） */
    @Query(value = """
            SELECT sc.id AS category_id, COALESCE(course_counts.cnt, 0) AS cnt
            FROM sys_categories sc
            LEFT JOIN (
                SELECT assigned.root_id, COUNT(DISTINCT assigned.course_id) AS cnt
                FROM (
                    SELECT c.id AS course_id,
                           CASE WHEN category.level = 1 THEN category.id ELSE category.parent_id END AS root_id
                    FROM courses c
                    INNER JOIN sys_categories category
                        ON category.id = c.category_id AND category.type = 'COURSE_CATEGORY'
                    WHERE c.status = 2
                      AND ((:openOnly = 1 AND c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE'))
                           OR (:openOnly = 0 AND c.type = 'INTERNAL'))
                      AND NOT (c.type = 'OPEN_OFFLINE' AND c.is_expire_hide = 1
                               AND c.course_open_end_date IS NOT NULL
                               AND c.course_open_end_date < CURDATE())
                    UNION ALL
                    SELECT c.id AS course_id,
                           CASE WHEN category.level = 1 THEN category.id ELSE category.parent_id END AS root_id
                    FROM courses c
                    INNER JOIN sys_categories category
                        ON category.id = c.sub_category_id AND category.type = 'COURSE_CATEGORY'
                    WHERE c.status = 2
                      AND ((:openOnly = 1 AND c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE'))
                           OR (:openOnly = 0 AND c.type = 'INTERNAL'))
                      AND NOT (c.type = 'OPEN_OFFLINE' AND c.is_expire_hide = 1
                               AND c.course_open_end_date IS NOT NULL
                               AND c.course_open_end_date < CURDATE())
                ) assigned
                WHERE assigned.root_id IS NOT NULL
                GROUP BY assigned.root_id
            ) course_counts ON course_counts.root_id = sc.id
            WHERE sc.type = 'COURSE_CATEGORY'
              AND sc.level = 1
              AND sc.is_visible = 1
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

    /** Published courses grouped by visible level-two category. */
    @Query(value = """
            SELECT sc.id AS category_id, COALESCE(course_counts.cnt, 0) AS cnt
            FROM sys_categories sc
            LEFT JOIN (
                SELECT assigned.category_id, COUNT(DISTINCT assigned.course_id) AS cnt
                FROM (
                    SELECT c.id AS course_id, c.category_id
                    FROM courses c
                    WHERE c.status = 2
                      AND ((:openOnly = 1 AND c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE'))
                           OR (:openOnly = 0 AND c.type = 'INTERNAL'))
                      AND NOT (c.type = 'OPEN_OFFLINE' AND c.is_expire_hide = 1
                               AND c.course_open_end_date IS NOT NULL
                               AND c.course_open_end_date < CURDATE())
                    UNION ALL
                    SELECT c.id AS course_id, c.sub_category_id AS category_id
                    FROM courses c
                    WHERE c.status = 2
                      AND ((:openOnly = 1 AND c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE'))
                           OR (:openOnly = 0 AND c.type = 'INTERNAL'))
                      AND NOT (c.type = 'OPEN_OFFLINE' AND c.is_expire_hide = 1
                               AND c.course_open_end_date IS NOT NULL
                               AND c.course_open_end_date < CURDATE())
                ) assigned
                WHERE assigned.category_id IS NOT NULL
                GROUP BY assigned.category_id
            ) course_counts ON course_counts.category_id = sc.id
            WHERE sc.type = 'COURSE_CATEGORY'
              AND sc.level = 2
              AND sc.is_visible = 1
            """, nativeQuery = true)
    List<Object[]> countPublishedByCategoryL2(@Param("openOnly") int openOnly);

    /** Published open courses grouped by level-two category and filtered by teaching city. */
    @Query(value = """
            SELECT sc.id AS category_id, COUNT(DISTINCT c.id) AS cnt
            FROM sys_categories sc
            LEFT JOIN courses c ON c.status = 2
                AND c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE')
                AND (c.category_id = sc.id OR c.sub_category_id = sc.id)
                AND NOT (
                    c.type = 'OPEN_OFFLINE'
                    AND c.is_expire_hide = 1
                    AND c.course_open_end_date IS NOT NULL
                    AND c.course_open_end_date < CURDATE()
                )
            INNER JOIN course_plans cp ON cp.course_id = c.id AND cp.city_id IN (:cityIds)
            WHERE sc.type = 'COURSE_CATEGORY'
              AND sc.level = 2
              AND sc.is_visible = 1
            GROUP BY sc.id
            """, nativeQuery = true)
    List<Object[]> countPublishedOpenByCategoryL2AndCityIds(@Param("cityIds") Collection<Integer> cityIds);

    @Query(value = """
            SELECT cp.province_id, COUNT(DISTINCT c.id)
            FROM courses c
            INNER JOIN course_plans cp ON cp.course_id = c.id
            WHERE c.status = 2
              AND c.type = :courseType
              AND cp.province_id > 0
              AND cp.start_time >= CURRENT_TIMESTAMP
              AND (:categoryId IS NULL OR c.category_id = :categoryId)
              AND (:subCategoryId IS NULL OR c.sub_category_id = :subCategoryId)
              AND (:isFree IS NULL OR c.is_free = :isFree)
              AND (:minPrice IS NULL OR c.price >= :minPrice)
              AND (:maxPrice IS NULL OR c.price <= :maxPrice)
              AND (:startFrom IS NULL OR cp.start_time >= :startFrom)
              AND (:startTo IS NULL OR cp.start_time <= :startTo)
            GROUP BY cp.province_id
            ORDER BY COUNT(DISTINCT c.id) DESC, cp.province_id ASC
            """, nativeQuery = true)
    List<Object[]> countFuturePlanProvinces(
            @Param("courseType") String courseType,
            @Param("categoryId") Integer categoryId,
            @Param("subCategoryId") Integer subCategoryId,
            @Param("isFree") Integer isFree,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("startFrom") LocalDateTime startFrom,
            @Param("startTo") LocalDateTime startTo);

    @Query(value = """
            SELECT cp.city_id, COUNT(DISTINCT c.id)
            FROM courses c
            INNER JOIN course_plans cp ON cp.course_id = c.id
            WHERE c.status = 2
              AND c.type = :courseType
              AND cp.city_id > 0
              AND cp.start_time >= CURRENT_TIMESTAMP
              AND (:provinceId IS NULL OR cp.province_id = :provinceId)
              AND (:categoryId IS NULL OR c.category_id = :categoryId)
              AND (:subCategoryId IS NULL OR c.sub_category_id = :subCategoryId)
              AND (:isFree IS NULL OR c.is_free = :isFree)
              AND (:minPrice IS NULL OR c.price >= :minPrice)
              AND (:maxPrice IS NULL OR c.price <= :maxPrice)
              AND (:startFrom IS NULL OR cp.start_time >= :startFrom)
              AND (:startTo IS NULL OR cp.start_time <= :startTo)
            GROUP BY cp.city_id
            ORDER BY COUNT(DISTINCT c.id) DESC, cp.city_id ASC
            """, nativeQuery = true)
    List<Object[]> countFuturePlanCities(
            @Param("courseType") String courseType,
            @Param("provinceId") Integer provinceId,
            @Param("categoryId") Integer categoryId,
            @Param("subCategoryId") Integer subCategoryId,
            @Param("isFree") Integer isFree,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("startFrom") LocalDateTime startFrom,
            @Param("startTo") LocalDateTime startTo);

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
