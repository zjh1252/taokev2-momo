package com.taoke.user.repository;

import com.taoke.user.entity.TrainerCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 专家授课案例 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:30
 */
public interface TrainerCaseRepository extends JpaRepository<TrainerCase, Integer> {

    List<TrainerCase> findByTrainerIdOrderBySortOrderDesc(Integer trainerId);

    List<TrainerCase> findByTrainerIdAndStatusOrderBySortOrderDesc(Integer trainerId, Integer status);

    Page<TrainerCase> findByTrainerId(Integer trainerId, Pageable pageable);

    /** 后台分页查询，支持按专家 ID 和状态筛选 */
    @Query("SELECT c FROM TrainerCase c WHERE " +
            "(:trainerId IS NULL OR c.trainerId = :trainerId) " +
            "AND (:status IS NULL OR c.status = :status)")
    Page<TrainerCase> adminSearch(@Param("trainerId") Integer trainerId,
                                  @Param("status") Integer status,
                                  Pageable pageable);

    /** C 端：最近的已审核案例（专家列表页/首页轮播位用） */
    @Query("SELECT c FROM TrainerCase c WHERE c.status = 1 " +
            "ORDER BY c.sortOrder DESC, c.id DESC")
    List<TrainerCase> findRecentApproved(Pageable pageable);
}
