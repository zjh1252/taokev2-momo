package com.taoke.user.repository;

import com.taoke.user.entity.TrainerExpertiseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

    /** 推荐相关专家用：按分类 ID 集合反查所有候选关联 */
    List<TrainerExpertiseCategory> findByCategoryIdIn(Collection<Integer> categoryIds);

    void deleteByTrainerId(Integer trainerId);

    /** 检查是否有专家关联了该分类 */
    boolean existsByCategoryId(Integer categoryId);

    /** 已发布专家按擅长领域一级分类批量计数（含其下二级分类，与 listPublic 筛选口径一致） */
    @Query(value = """
            SELECT l1.id AS category_id, COUNT(DISTINCT t.id) AS cnt
            FROM sys_categories l1
            LEFT JOIN sys_categories l2 ON l2.parent_id = l1.id AND l2.type = 'TRAINER_EXPERTISE'
            LEFT JOIN trainer_expertise_categories tec
                ON tec.category_id = l1.id OR tec.category_id = l2.id
            LEFT JOIN user_trainers t ON t.id = tec.trainer_id AND t.status = 2
            WHERE l1.type = 'TRAINER_EXPERTISE'
              AND l1.level = 1
              AND l1.is_visible = 1
            GROUP BY l1.id
            """, nativeQuery = true)
    List<Object[]> countPublishedTrainersByExpertiseL1();
}
