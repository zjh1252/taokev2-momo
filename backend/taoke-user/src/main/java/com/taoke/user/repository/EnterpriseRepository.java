package com.taoke.user.repository;

import com.taoke.user.entity.Enterprise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 企业信息持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
public interface EnterpriseRepository extends JpaRepository<Enterprise, Integer> {

    Optional<Enterprise> findByUserId(Integer userId);
}
