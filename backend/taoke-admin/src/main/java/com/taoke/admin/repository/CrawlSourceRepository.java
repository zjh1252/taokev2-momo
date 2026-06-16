package com.taoke.admin.repository;

import com.taoke.admin.entity.CrawlSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 爬虫数据源配置持久化。
 *
 * @author Fangxinxin
 * @date 2026-06-15 16:00
 */
public interface CrawlSourceRepository extends JpaRepository<CrawlSource, Integer> {

    List<CrawlSource> findAllByOrderBySortOrderAscIdAsc();

    Optional<CrawlSource> findByCodeAndDataType(String code, String dataType);

    boolean existsByCodeAndDataType(String code, String dataType);

    boolean existsByCodeAndDataTypeAndIdNot(String code, String dataType, Integer id);
}
