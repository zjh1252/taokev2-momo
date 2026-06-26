package com.taoke.admin.repository;

import com.taoke.admin.entity.CrawlJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 爬虫任务记录持久化。
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
public interface CrawlJobRepository extends JpaRepository<CrawlJob, Integer> {

    Page<CrawlJob> findBySourceAndDataType(String source, String dataType, Pageable pageable);

    Page<CrawlJob> findByStatus(Integer status, Pageable pageable);

    Optional<CrawlJob> findByCrawlerJobId(String crawlerJobId);
}
