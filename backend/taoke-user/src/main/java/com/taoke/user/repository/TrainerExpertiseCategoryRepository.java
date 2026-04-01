package com.taoke.user.repository;

import com.taoke.user.entity.TrainerExpertiseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * 专家-培训领域关联持久化
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:55
 */
public interface TrainerExpertiseCategoryRepository extends JpaRepository<TrainerExpertiseCategory, Integer> {

    List<TrainerExpertiseCategory> findByTrainerIdOrderBySortOrder(Integer trainerId);

    List<TrainerExpertiseCategory> findByTrainerIdInOrderBySortOrder(Collection<Integer> trainerIds);

    void deleteByTrainerId(Integer trainerId);
}
