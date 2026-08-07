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

    /** Approved trainers grouped by visible managed industry category. */
    @Query(value = """
            SELECT c.id AS category_id, COUNT(DISTINCT t.id) AS cnt
            FROM sys_categories c
            LEFT JOIN trainer_industry_categories tic ON tic.category_id = c.id
            LEFT JOIN user_trainers t ON t.id = tic.trainer_id AND t.status = 2
            WHERE c.type = 'TRAINER_INDUSTRY'
              AND c.is_visible = 1
            GROUP BY c.id
            """, nativeQuery = true)
    List<Object[]> countPublishedTrainersByIndustry();
}
