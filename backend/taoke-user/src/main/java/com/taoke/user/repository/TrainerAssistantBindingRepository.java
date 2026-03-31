package com.taoke.user.repository;

import com.taoke.user.entity.TrainerAssistantBinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 专家-助理绑定关系持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface TrainerAssistantBindingRepository extends JpaRepository<TrainerAssistantBinding, Integer> {

    Optional<TrainerAssistantBinding> findByTrainerUserId(Integer trainerUserId);

    Optional<TrainerAssistantBinding> findByAssistantUserId(Integer assistantUserId);
}
