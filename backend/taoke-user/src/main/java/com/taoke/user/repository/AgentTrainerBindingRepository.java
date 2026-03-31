package com.taoke.user.repository;

import com.taoke.user.entity.AgentTrainerBinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 经纪人-专家绑定关系持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface AgentTrainerBindingRepository extends JpaRepository<AgentTrainerBinding, Integer> {

    List<AgentTrainerBinding> findByAgentUserId(Integer agentUserId);

    List<AgentTrainerBinding> findByTrainerUserId(Integer trainerUserId);

    Optional<AgentTrainerBinding> findByAgentUserIdAndTrainerUserId(Integer agentUserId, Integer trainerUserId);
}
