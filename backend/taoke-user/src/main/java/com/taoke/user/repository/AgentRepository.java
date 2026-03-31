package com.taoke.user.repository;

import com.taoke.user.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 专家经纪人档案持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface AgentRepository extends JpaRepository<Agent, Integer> {

    Optional<Agent> findByUserId(Integer userId);
}
