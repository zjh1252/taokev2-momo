package com.taoke.user.repository;

import com.taoke.user.entity.Assistant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 专家助理档案持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface AssistantRepository extends JpaRepository<Assistant, Integer> {

    Optional<Assistant> findByUserId(Integer userId);
}
