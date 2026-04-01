package com.taoke.user.repository;

import com.taoke.user.entity.TrainerEducation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

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
}
