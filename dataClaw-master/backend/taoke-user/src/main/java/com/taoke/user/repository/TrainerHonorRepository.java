package com.taoke.user.repository;

import com.taoke.user.entity.TrainerHonor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * 专家荣誉资质持久化
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
public interface TrainerHonorRepository extends JpaRepository<TrainerHonor, Integer> {

    List<TrainerHonor> findByTrainerIdOrderBySortOrder(Integer trainerId);

    List<TrainerHonor> findByTrainerIdInOrderBySortOrder(Collection<Integer> trainerIds);

    void deleteByTrainerId(Integer trainerId);
}
