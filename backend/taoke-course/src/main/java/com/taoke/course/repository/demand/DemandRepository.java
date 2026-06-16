package com.taoke.course.repository.demand;

import com.taoke.course.entity.demand.Demand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 培训需求 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
public interface DemandRepository extends JpaRepository<Demand, Integer> {

    /**
     * 按用户 ID 分页查询（可选状态筛选）
     */
    @Query("SELECT d FROM Demand d WHERE d.userId = :userId"
            + " AND (:status IS NULL OR d.status = :status)"
            + " ORDER BY d.createdAt DESC")
    Page<Demand> findByUserIdAndOptionalStatus(@Param("userId") Integer userId,
                                                @Param("status") Integer status,
                                                Pageable pageable);

    /**
     * 后台分页搜索（状态 + 类型 + 关键词模糊匹配标题/培训主题）
     */
    @Query("SELECT d FROM Demand d WHERE"
            + " (:status IS NULL OR d.status = :status)"
            + " AND (:demandType IS NULL OR d.demandType = :demandType)"
            + " AND (:keyword IS NULL OR d.demandNo LIKE CONCAT('%',:keyword,'%')"
            + "      OR d.title LIKE CONCAT('%',:keyword,'%')"
            + "      OR d.trainingTopic LIKE CONCAT('%',:keyword,'%'))"
            + " ORDER BY d.createdAt DESC")
    Page<Demand> adminSearch(@Param("status") Integer status,
                             @Param("demandType") String demandType,
                             @Param("keyword") String keyword,
                             Pageable pageable);

    long countByStatus(Integer status);
}
