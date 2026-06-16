package com.taoke.user.repository;

import com.taoke.user.entity.AgentWorkExperience;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * 经纪人工作认证持久化。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
public interface AgentWorkExperienceRepository extends JpaRepository<AgentWorkExperience, Integer> {

    List<AgentWorkExperience> findByAgentIdOrderBySortOrder(Integer agentId);

    List<AgentWorkExperience> findByAgentIdInOrderBySortOrder(Collection<Integer> agentIds);

    void deleteByAgentId(Integer agentId);

    Page<AgentWorkExperience> findByStatus(Integer status, Pageable pageable);

    Page<AgentWorkExperience> findAll(Pageable pageable);
}
