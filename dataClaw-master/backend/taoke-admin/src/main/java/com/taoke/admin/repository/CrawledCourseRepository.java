package com.taoke.admin.repository;

import com.taoke.admin.entity.CrawledCourse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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

    long countByReviewStatus(Integer reviewStatus);

    long countByDedupStatus(Integer dedupStatus);
}
