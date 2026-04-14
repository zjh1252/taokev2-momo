package com.taoke.user.repository;

import com.taoke.user.entity.Assistant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 专家助理档案持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface AssistantRepository extends JpaRepository<Assistant, Integer>,
        JpaSpecificationExecutor<Assistant> {

    Optional<Assistant> findByUserId(Integer userId);

    List<Assistant> findByUserIdIn(Collection<Integer> userIds);
}
