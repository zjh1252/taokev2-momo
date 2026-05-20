package com.taoke.common.repository;

import com.taoke.common.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * 行政区划 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-01 16:00
 */
public interface RegionRepository extends JpaRepository<Region, Integer> {

    /** 按父级编码查询下级列表，按 code 升序 */
    List<Region> findByParentCodeOrderByCodeAsc(String parentCode);

    /** 按区划编码精确查询 */
    Optional<Region> findByCode(String code);

    /** 按拼音（en_name）精确查询，主要用于城市频道页路由解析 */
    Optional<Region> findByEnName(String enName);

    /** 按名称模糊搜索，可选限定层级，限制返回条数 */
    @Query("SELECT r FROM Region r WHERE r.name LIKE %:keyword% "
            + "AND (:level IS NULL OR r.level = :level) "
            + "ORDER BY r.level ASC, r.code ASC "
            + "LIMIT 20")
    List<Region> searchByKeyword(String keyword, Integer level);

    /** 判断某个 parentCode 下是否存在子级记录 */
    boolean existsByParentCode(String parentCode);
}
