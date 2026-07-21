package com.taoke.course.repository;

import com.taoke.course.entity.cms.StaticPage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 静态页面仓储
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
public interface StaticPageRepository extends JpaRepository<StaticPage, Integer> {

    Optional<StaticPage> findByPageCode(String pageCode);
}
