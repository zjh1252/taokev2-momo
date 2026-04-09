package com.taoke.user.repository;

import com.taoke.user.entity.EnterpriseBuyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 企业培训采购方信息持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
public interface EnterpriseBuyerRepository extends JpaRepository<EnterpriseBuyer, Integer>,
        JpaSpecificationExecutor<EnterpriseBuyer> {

    Optional<EnterpriseBuyer> findByUserId(Integer userId);

    List<EnterpriseBuyer> findByUserIdIn(Collection<Integer> userIds);
}
