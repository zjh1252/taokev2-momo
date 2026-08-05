package com.taoke.user.repository;

import com.taoke.user.entity.EnterpriseBuyerWorkExperience;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * 企业采购方工作认证持久化。
 *
 * @author Fangxinxin
 * @date 2026-06-27 14:00
 */
public interface EnterpriseBuyerWorkExperienceRepository
        extends JpaRepository<EnterpriseBuyerWorkExperience, Integer> {

    List<EnterpriseBuyerWorkExperience> findByBuyerIdOrderBySortOrder(Integer buyerId);

    List<EnterpriseBuyerWorkExperience> findByBuyerIdInOrderBySortOrder(Collection<Integer> buyerIds);

    Page<EnterpriseBuyerWorkExperience> findByStatus(Integer status, Pageable pageable);

    Page<EnterpriseBuyerWorkExperience> findAll(Pageable pageable);
}
