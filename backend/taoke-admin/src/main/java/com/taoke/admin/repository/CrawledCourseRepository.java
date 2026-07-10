package com.taoke.admin.repository;

import com.taoke.admin.entity.CrawledCourse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 爬取课程数据持久化。
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
public interface CrawledCourseRepository extends JpaRepository<CrawledCourse, Integer> {

    Page<CrawledCourse> findByReviewStatus(Integer reviewStatus, Pageable pageable);

    Page<CrawledCourse> findBySourceAndReviewStatus(String source, Integer reviewStatus, Pageable pageable);

    Page<CrawledCourse> findBySource(String source, Pageable pageable);

    Optional<CrawledCourse> findBySourceAndSourceCourseId(String source, String sourceCourseId);

    @Query("""
            select c from CrawledCourse c
            where (:type is null or c.type = :type)
              and c.reviewStatus in :reviewStatuses
              and (:excludeId is null or c.id <> :excludeId)
            order by c.id desc
            """)
    List<CrawledCourse> findDedupCandidates(@Param("type") String type,
                                            @Param("reviewStatuses") Collection<Integer> reviewStatuses,
                                            @Param("excludeId") Integer excludeId,
                                            Pageable pageable);

    long countByReviewStatus(Integer reviewStatus);

    long countByDedupStatus(Integer dedupStatus);
}
