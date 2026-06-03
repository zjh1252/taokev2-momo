package com.taoke.course.repository;

import com.taoke.course.entity.Course;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 课程持久化
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
public interface CourseRepository extends JpaRepository<Course, Integer>, JpaSpecificationExecutor<Course> {

    long countByCreatedAtAfter(LocalDateTime time);

    /**
     * 本周活跃机构：在 since 之后有「已上架」课程发布的机构 user_id，按最近发布时间倒序。
     */
    @Query("SELECT c.publisherId FROM Course c "
            + "WHERE c.publisherType = 'INSTITUTION' AND c.status = 2 AND c.publishedAt >= :since "
            + "GROUP BY c.publisherId ORDER BY MAX(c.publishedAt) DESC")
    List<Integer> findRecentlyActiveInstitutionUserIds(@Param("since") LocalDateTime since, Pageable pageable);
}
