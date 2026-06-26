package com.taoke.course.service.interaction;

import com.taoke.course.api.ReviewModerationService;
import com.taoke.course.entity.interaction.TrainingReview;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

/**
 * 评价审核接口实现 — 委托到 ReviewServiceImpl
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Service
@RequiredArgsConstructor
public class ReviewModerationServiceImpl implements ReviewModerationService {

    private final ReviewServiceImpl reviewService;

    @Override
    public void approveReview(int reviewId, int operatorUserId) {
        reviewService.approveReview(reviewId, operatorUserId);
    }

    @Override
    public void rejectReview(int reviewId, int operatorUserId, String reason) {
        reviewService.rejectReview(reviewId, reason, operatorUserId);
    }

    @Override
    public void hideReview(int reviewId, int operatorUserId) {
        reviewService.hideReview(reviewId);
    }

    @Override
    public Page<TrainingReview> listPendingReviews(int page, int size) {
        return reviewService.listPendingReviews(page, size);
    }
}
