package com.taoke.course.service.interaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.eventbus.EventPublisher;
import com.taoke.course.entity.interaction.TrainingReview;
import com.taoke.course.enums.ReviewScope;
import com.taoke.course.enums.ReviewStatus;
import com.taoke.course.repository.interaction.TrainingReviewRepository;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 评价审核后同步专家/机构评分与评论数。
 *
 * @author Fangxinxin
 * @date 2026-07-17 09:40
 */
@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private TrainingReviewRepository reviewRepository;
    @Mock
    private InteractionTargetValidator targetValidator;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private TrainerService trainerService;
    @Mock
    private InstitutionService institutionService;
    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private ReviewServiceImpl service;

    @Test
    void approveReview_refreshesTrainerScoreFromApprovedAvg() {
        TrainingReview review = new TrainingReview();
        review.setId(11);
        review.setUserId(100);
        review.setReviewScope(ReviewScope.TRAINER.name());
        review.setTrainerUserId(201);
        review.setStatus(ReviewStatus.PENDING.getValue());
        review.setExpertName("钟越");

        when(reviewRepository.findById(11)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewRepository.countByTrainerUserIdAndStatus(201, ReviewStatus.APPROVED.getValue()))
                .thenReturn(2L);
        when(reviewRepository.averageAvgScoreByTrainerUserIdAndStatus(201, ReviewStatus.APPROVED.getValue()))
                .thenReturn(4.50);

        service.approveReview(11, 9);

        verify(trainerService).updateReviewStatsByUserId(
                eq(201), eq(new BigDecimal("4.50")), eq(2));
    }

    @Test
    void hideReview_fromApproved_refreshesTrainerScoreToZeroWhenNoApprovedLeft() {
        TrainingReview review = new TrainingReview();
        review.setId(12);
        review.setUserId(100);
        review.setReviewScope(ReviewScope.TRAINER.name());
        review.setTrainerUserId(202);
        review.setStatus(ReviewStatus.APPROVED.getValue());
        review.setExpertName("刘雪峰");

        when(reviewRepository.findById(12)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewRepository.countByTrainerUserIdAndStatus(202, ReviewStatus.APPROVED.getValue()))
                .thenReturn(0L);
        when(reviewRepository.averageAvgScoreByTrainerUserIdAndStatus(202, ReviewStatus.APPROVED.getValue()))
                .thenReturn(null);

        service.hideReview(12);

        verify(trainerService).updateReviewStatsByUserId(
                eq(202), eq(BigDecimal.ZERO.setScale(2)), eq(0));
    }

    @Test
    void approveReview_refreshesInstitutionScoreFromApprovedAvg() {
        TrainingReview review = new TrainingReview();
        review.setId(13);
        review.setUserId(100);
        review.setReviewScope(ReviewScope.INSTITUTION.name());
        review.setInstitutionId(88);
        review.setStatus(ReviewStatus.PENDING.getValue());

        when(reviewRepository.findById(13)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewRepository.countByInstitutionIdAndStatus(88, ReviewStatus.APPROVED.getValue()))
                .thenReturn(3L);
        when(reviewRepository.averageAvgScoreByInstitutionIdAndStatus(88, ReviewStatus.APPROVED.getValue()))
                .thenReturn(4.8333);

        service.approveReview(13, 9);

        verify(institutionService).updateReviewStats(
                eq(88), eq(new BigDecimal("4.83")), eq(3));
    }
}
