package com.taoke.user.repository;

import com.taoke.user.entity.TrainerHighlight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

/**
 * 专家精彩瞬间 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
public interface TrainerHighlightRepository extends JpaRepository<TrainerHighlight, Integer>,
        JpaSpecificationExecutor<TrainerHighlight> {

    List<TrainerHighlight> findByTrainerIdOrderBySortOrderAsc(Integer trainerId);

    List<TrainerHighlight> findByTrainerIdAndStatusOrderBySortOrderAsc(Integer trainerId, Integer status);
}
