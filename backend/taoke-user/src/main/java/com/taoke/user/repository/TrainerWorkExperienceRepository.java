package com.taoke.user.repository;

import com.taoke.user.entity.TrainerWorkExperience;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/**
 * 专家工作经历持久化
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
public interface TrainerWorkExperienceRepository extends JpaRepository<TrainerWorkExperience, Integer> {

    List<TrainerWorkExperience> findByTrainerIdOrderBySortOrder(Integer trainerId);

    List<TrainerWorkExperience> findByTrainerIdInOrderBySortOrder(Collection<Integer> trainerIds);

    void deleteByTrainerId(Integer trainerId);

    Page<TrainerWorkExperience> findByStatus(Integer status, Pageable pageable);

    Page<TrainerWorkExperience> findAll(Pageable pageable);

    @Query("SELECT DISTINCT w.trainerId FROM TrainerWorkExperience w WHERE w.trainerId IN :trainerIds AND w.status = 2")
    Set<Integer> findTrainerIdsWithApprovedWork(@Param("trainerIds") Collection<Integer> trainerIds);
}
