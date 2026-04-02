package com.taoke.user.repository;

import com.taoke.user.entity.TrainerWorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

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
}
