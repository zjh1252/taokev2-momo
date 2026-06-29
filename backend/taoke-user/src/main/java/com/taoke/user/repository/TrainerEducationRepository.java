package com.taoke.user.repository;

import com.taoke.user.entity.TrainerEducation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/**
 * 专家教育经历持久化
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
public interface TrainerEducationRepository extends JpaRepository<TrainerEducation, Integer> {

    List<TrainerEducation> findByTrainerIdOrderBySortOrder(Integer trainerId);

    List<TrainerEducation> findByTrainerIdInOrderBySortOrder(Collection<Integer> trainerIds);

    void deleteByTrainerId(Integer trainerId);

    /** 按状态分页（不传时取所有） */
    Page<TrainerEducation> findByStatus(Integer status, Pageable pageable);

    Page<TrainerEducation> findAll(Pageable pageable);

    @Query("SELECT DISTINCT e.trainerId FROM TrainerEducation e WHERE e.trainerId IN :trainerIds AND e.status = 2")
    Set<Integer> findTrainerIdsWithApprovedEducation(@Param("trainerIds") Collection<Integer> trainerIds);
}
