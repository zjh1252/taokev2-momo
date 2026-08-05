package com.taoke.course.repository;

import com.taoke.course.entity.cms.FooterConfig;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 底部全局配置仓储
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
public interface FooterConfigRepository extends JpaRepository<FooterConfig, Integer> {
}
