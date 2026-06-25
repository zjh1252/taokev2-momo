package com.taoke.user.repository;

import com.taoke.user.entity.TrainerCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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

    /**
     * 后台分页查询，支持按专家 ID 和状态筛选。
     * <p>草稿(status=3)不进入后台审核列表：未显式指定状态时排除草稿。</p>
     */
    @Query("SELECT c FROM TrainerCase c WHERE " +
            "(:trainerId IS NULL OR c.trainerId = :trainerId) " +
            "AND (:status IS NULL OR c.status = :status) " +
            "AND (:status IS NOT NULL OR c.status <> 3)")
    Page<TrainerCase> adminSearch(@Param("trainerId") Integer trainerId,
                                  @Param("status") Integer status,
                                  Pageable pageable);

    /**
     * C 端：最近的已审核案例（专家列表页/首页轮播位用）
     * <p>按 id 倒序取最新，避免对全表 sort_order 做 filesort（旧库数据量大时易触发 sort buffer 溢出）。</p>
     */
    @Query("SELECT c FROM TrainerCase c WHERE c.status = 1 ORDER BY c.id DESC")
    List<TrainerCase> findRecentApproved(Pageable pageable);

    /** C 端案例详情访问 +1（原子更新，避免并发覆盖） */
    @Modifying
    @Query("UPDATE TrainerCase c SET c.viewCount = COALESCE(c.viewCount, 0) + 1 WHERE c.id = :id")
    void incrementViewCount(@Param("id") Integer id);

    @Query("SELECT c FROM TrainerCase c WHERE c.status = 1 AND c.trainerId IN :trainerIds ORDER BY c.sortOrder DESC, c.id DESC")
    List<TrainerCase> findApprovedByTrainerIds(@Param("trainerIds") List<Integer> trainerIds, Pageable pageable);

    @Query("SELECT c.trainerId, COUNT(c) FROM TrainerCase c WHERE c.trainerId IN :ids GROUP BY c.trainerId")
    List<Object[]> countGroupByTrainerIds(@Param("ids") Collection<Integer> ids);
}
