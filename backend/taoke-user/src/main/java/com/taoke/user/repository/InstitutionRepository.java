package com.taoke.user.repository;

import com.taoke.user.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 机构信息持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
public interface InstitutionRepository extends JpaRepository<Institution, Integer>,
        JpaSpecificationExecutor<Institution> {

    Optional<Institution> findByUserId(Integer userId);

    List<Institution> findByUserIdIn(Collection<Integer> userIds);

    /** 按机构名批量查可用 Logo（同名多行迁移时，partner 行常无 logo 或为占位图，organ 行有真实图） */
    @Query(value = """
            SELECT org_name, logo_url FROM user_institutions
            WHERE org_name IN (:orgNames)
              AND TRIM(COALESCE(logo_url, '')) != ''
              AND logo_url NOT LIKE '%/middle/00/1.%'
              AND logo_url NOT LIKE '%/middle/00/1'
            ORDER BY view_count DESC, id DESC
            """, nativeQuery = true)
    List<Object[]> findLogoRowsByOrgNames(@Param("orgNames") Collection<String> orgNames);
}
