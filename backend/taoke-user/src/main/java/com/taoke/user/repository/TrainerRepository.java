package com.taoke.user.repository;

import com.taoke.user.entity.Trainer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 专家档案持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
public interface TrainerRepository extends JpaRepository<Trainer, Integer>, JpaSpecificationExecutor<Trainer> {

    Optional<Trainer> findByUserId(Integer userId);

    List<Trainer> findByName(String name);

    List<Trainer> findByIdIn(Collection<Integer> ids);

    boolean existsByTrainerCode(String trainerCode);

    /**
     * 三段式查询第一段：分页查满足条件的专家 ID
     */
    @Query("SELECT t.id FROM Trainer t WHERE t.status = 2 ORDER BY t.sortOrder DESC, t.score DESC, t.id DESC")
    Page<Integer> findApprovedTrainerIds(Pageable pageable);

    long countByStatus(Integer status);

    long countByStatusAndApprovedAtAfter(Integer status, LocalDateTime time);
}
