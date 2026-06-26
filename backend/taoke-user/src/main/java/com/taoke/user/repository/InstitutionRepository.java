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

    /** 老站 URL 段 roleid → 机构主体（仅公开展示行） */
    @Query("SELECT i FROM Institution i WHERE i.legacyRoleId = ?1 AND i.status = ?2 AND i.publicListEligible = true")
    Optional<Institution> findFirstByLegacyRoleIdAndStatusAndPublicListEligibleTrue(
            Integer legacyRoleId, Integer status, Boolean publicListEligible);

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

    /** 公开机构按擅长领域一级分类批量计数（侧栏导航，单次查询替代 N 次 listPublic） */
    @Query(value = """
            SELECT sc.id AS category_id, COUNT(ui.id) AS cnt
            FROM sys_categories sc
            LEFT JOIN user_institutions ui ON ui.status = 1
                AND ui.public_list_eligible = 1
                AND ui.org_name NOT LIKE '未命名机构#%'
                AND (:association IS NULL OR ui.association = :association)
                AND ui.specialties IS NOT NULL
                AND TRIM(ui.specialties) <> ''
                AND FIND_IN_SET(sc.id, REPLACE(ui.specialties, ' ', '')) > 0
            WHERE sc.type = 'TRAINER_EXPERTISE'
              AND sc.level = 1
              AND sc.is_visible = 1
            GROUP BY sc.id
            """, nativeQuery = true)
    List<Object[]> countPublicByExpertiseL1(@Param("association") Boolean association);
}
