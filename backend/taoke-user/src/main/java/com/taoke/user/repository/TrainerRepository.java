package com.taoke.user.repository;

import com.taoke.user.entity.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 专家档案持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface TrainerRepository extends JpaRepository<Trainer, Integer> {

    Optional<Trainer> findByUserId(Integer userId);
}
