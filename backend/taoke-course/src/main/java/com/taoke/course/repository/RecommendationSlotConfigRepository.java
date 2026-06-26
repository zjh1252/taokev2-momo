package com.taoke.course.repository;

import com.taoke.course.entity.cms.RecommendationSlotConfig;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 推荐位布局配置仓储
 *
 * @author Fangxinxin
 * @date 2026-06-16 14:00
 */
public interface RecommendationSlotConfigRepository extends JpaRepository<RecommendationSlotConfig, String> {
}
