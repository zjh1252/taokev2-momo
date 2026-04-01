package com.taoke.user.repository;

import com.taoke.user.entity.TrainerCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * 专家培训领域分类关联持久化
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
public interface TrainerCategoryRepository extends JpaRepository<TrainerCategory, Integer> {

    List<TrainerCategory> findByTrainerIdOrderBySortOrder(Integer trainerId);

    List<TrainerCategory> findByTrainerIdInOrderBySortOrder(Collection<Integer> trainerIds);

    void deleteByTrainerId(Integer trainerId);
}
