package com.taoke.admin.repository;

import com.taoke.admin.entity.CrawledTrainer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 爬取专家数据持久化。
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
public interface CrawledTrainerRepository extends JpaRepository<CrawledTrainer, Integer> {

    Page<CrawledTrainer> findByReviewStatus(Integer reviewStatus, Pageable pageable);

    Page<CrawledTrainer> findBySourceAndReviewStatus(String source, Integer reviewStatus, Pageable pageable);

    Page<CrawledTrainer> findBySource(String source, Pageable pageable);

    Optional<CrawledTrainer> findBySourceAndSourceTrainerId(String source, String sourceTrainerId);

    long countByReviewStatus(Integer reviewStatus);

    long countByDedupStatus(Integer dedupStatus);
}
