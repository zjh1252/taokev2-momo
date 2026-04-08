package com.taoke.course.api;

import com.taoke.course.entity.interaction.TrainingReview;
import org.springframework.data.domain.Page;

/**
 * 评价审核操作接口 — 供 taoke-admin 等编排层注入调用
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
public interface ReviewModerationService {

    /**
     * 审核通过评价
     */
    void approveReview(int reviewId, int operatorUserId);

    /**
     * 驳回评价
     */
    void rejectReview(int reviewId, int operatorUserId, String reason);

    /**
     * 隐藏评价
     */
    void hideReview(int reviewId, int operatorUserId);

    /**
     * 分页查询待审核评价
     */
    Page<TrainingReview> listPendingReviews(int page, int size);
}
