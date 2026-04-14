package com.taoke.user.repository;

import com.taoke.user.entity.EnterpriseAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 专家经纪公司信息持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
public interface EnterpriseAgentRepository extends JpaRepository<EnterpriseAgent, Integer>,
        JpaSpecificationExecutor<EnterpriseAgent> {

    Optional<EnterpriseAgent> findByUserId(Integer userId);

    List<EnterpriseAgent> findByUserIdIn(Collection<Integer> userIds);
}
