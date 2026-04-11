package com.taoke.user.repository;

import com.taoke.user.entity.TrainerHighlight;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 专家精彩瞬间 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
public interface TrainerHighlightRepository extends JpaRepository<TrainerHighlight, Integer> {

    List<TrainerHighlight> findByTrainerIdOrderBySortOrderDesc(Integer trainerId);

    List<TrainerHighlight> findByTrainerIdAndStatusOrderBySortOrderDesc(Integer trainerId, Integer status);

    /** 后台分页查询 */
    @Query("SELECT h FROM TrainerHighlight h WHERE " +
            "(:trainerId IS NULL OR h.trainerId = :trainerId) " +
            "AND (:status IS NULL OR h.status = :status)")
    Page<TrainerHighlight> adminSearch(@Param("trainerId") Integer trainerId,
                                       @Param("status") Integer status,
                                       Pageable pageable);
}
