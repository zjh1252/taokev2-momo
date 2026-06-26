package com.taoke.user.repository;

import com.taoke.user.entity.TrainerIndustryCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

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

    /** 推荐相关专家用：按分类 ID 集合反查所有候选关联 */
    List<TrainerIndustryCategory> findByCategoryIdIn(Collection<Integer> categoryIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from TrainerIndustryCategory t where t.trainerId = :trainerId")
    int deleteByTrainerId(Integer trainerId);

    /** 检查是否有专家关联了该分类 */
    boolean existsByCategoryId(Integer categoryId);
}
