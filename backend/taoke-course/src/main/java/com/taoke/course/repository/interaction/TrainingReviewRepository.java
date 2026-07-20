package com.taoke.course.repository.interaction;

import com.taoke.course.entity.interaction.TrainingReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /** 按案例查已通过的评价 */
    Page<TrainingReview> findByCaseIdAndStatusOrderByCreatedAtDesc(Integer caseId, Integer status, Pageable pageable);

    /** 统计某案例已通过评价数 */
    long countByCaseIdAndStatus(Integer caseId, Integer status);

    /** 统计某课程已通过评价数 */
    long countByCourseIdAndStatus(Integer courseId, Integer status);

    /** 统计某专家已通过评价数 */
    long countByTrainerUserIdAndStatus(Integer trainerUserId, Integer status);

    /** 统计某机构已通过评价数 */
    long countByInstitutionIdAndStatus(Integer institutionId, Integer status);

    /** 专家指定状态下评价 avg_score 算术平均（无记录时返回 null） */
    @Query("""
            SELECT AVG(r.avgScore)
            FROM TrainingReview r
            WHERE r.trainerUserId = :trainerUserId AND r.status = :status
            """)
    Double averageAvgScoreByTrainerUserIdAndStatus(
            @Param("trainerUserId") Integer trainerUserId,
            @Param("status") Integer status);

    /** 机构指定状态下评价 avg_score 算术平均（无记录时返回 null） */
    @Query("""
            SELECT AVG(r.avgScore)
            FROM TrainingReview r
            WHERE r.institutionId = :institutionId AND r.status = :status
            """)
    Double averageAvgScoreByInstitutionIdAndStatus(
            @Param("institutionId") Integer institutionId,
            @Param("status") Integer status);
}
