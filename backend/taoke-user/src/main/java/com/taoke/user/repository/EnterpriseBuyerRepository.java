package com.taoke.user.repository;

import com.taoke.user.entity.EnterpriseBuyer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 企业培训采购方信息持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
public interface EnterpriseBuyerRepository extends JpaRepository<EnterpriseBuyer, Integer> {

    Optional<EnterpriseBuyer> findByUserId(Integer userId);
}
