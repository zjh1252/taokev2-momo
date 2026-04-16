package com.taoke.course.repository.demand;

import com.taoke.course.entity.demand.DemandFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 需求跟进记录 Repository
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
public interface DemandFollowUpRepository extends JpaRepository<DemandFollowUp, Integer> {

    /**
     * 按需求 ID 查询跟进记录（时间倒序）
     */
    List<DemandFollowUp> findByDemandIdOrderByCreatedAtDesc(Integer demandId);
}
