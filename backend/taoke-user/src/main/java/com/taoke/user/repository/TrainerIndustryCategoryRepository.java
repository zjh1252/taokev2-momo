package com.taoke.user.repository;

import com.taoke.user.entity.TrainerIndustryCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * 专家-擅长行业关联持久化
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:55
 */
public interface TrainerIndustryCategoryRepository extends JpaRepository<TrainerIndustryCategory, Integer> {

    List<TrainerIndustryCategory> findByTrainerIdOrderBySortOrder(Integer trainerId);

    List<TrainerIndustryCategory> findByTrainerIdInOrderBySortOrder(Collection<Integer> trainerIds);

    void deleteByTrainerId(Integer trainerId);
}
