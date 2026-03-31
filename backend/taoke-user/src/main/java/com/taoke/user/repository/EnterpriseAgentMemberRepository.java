package com.taoke.user.repository;

import com.taoke.user.entity.EnterpriseAgentMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 经纪公司-经纪人成员持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface EnterpriseAgentMemberRepository extends JpaRepository<EnterpriseAgentMember, Integer> {

    List<EnterpriseAgentMember> findByEnterpriseAgentId(Integer enterpriseAgentId);

    Optional<EnterpriseAgentMember> findByAgentUserId(Integer agentUserId);

    Optional<EnterpriseAgentMember> findByEnterpriseAgentIdAndAgentUserId(Integer enterpriseAgentId, Integer agentUserId);
}
