package com.taoke.course.repository.interaction;

import com.taoke.course.entity.interaction.TrainingReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * 培训评价持久化
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
public interface TrainingReviewRepository extends JpaRepository<TrainingReview, Integer>,
        JpaSpecificationExecutor<TrainingReview> {

    /** 按课程查已通过的评价 */
    Page<TrainingReview> findByCourseIdAndStatusOrderByCreatedAtDesc(Integer courseId, Integer status, Pageable pageable);

    /** 按专家查已通过的评价 */
    Page<TrainingReview> findByTrainerUserIdAndStatusOrderByCreatedAtDesc(Integer trainerUserId, Integer status, Pageable pageable);

    /** 按机构查已通过的评价 */
    Page<TrainingReview> findByInstitutionIdAndStatusOrderByCreatedAtDesc(Integer institutionId, Integer status, Pageable pageable);

    /** 我的评价列表 */
    Page<TrainingReview> findByUserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);

    /** 待审核列表 */
    Page<TrainingReview> findByStatusOrderByCreatedAtDesc(Integer status, Pageable pageable);

    /** 统计某课程已通过评价数 */
    long countByCourseIdAndStatus(Integer courseId, Integer status);

    /** 统计某专家已通过评价数 */
    long countByTrainerUserIdAndStatus(Integer trainerUserId, Integer status);

    /** 统计某机构已通过评价数 */
    long countByInstitutionIdAndStatus(Integer institutionId, Integer status);
}
