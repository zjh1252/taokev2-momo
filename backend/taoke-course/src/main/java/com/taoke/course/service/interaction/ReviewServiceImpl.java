package com.taoke.course.service.interaction;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.interaction.ReviewVO;
import com.taoke.course.dto.interaction.SubmitReviewRequest;
import com.taoke.course.entity.interaction.TrainingReview;
import com.taoke.course.enums.ReviewScope;
import com.taoke.course.enums.ReviewStatus;
import com.taoke.course.repository.interaction.TrainingReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;

/**
 * 培训评价业务实现
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl {

    private final TrainingReviewRepository reviewRepository;
    private final InteractionTargetValidator targetValidator;
    private final ObjectMapper objectMapper;

    /**
     * 提交评价（状态为 PENDING）
     */
    @Transactional
    public Integer submitReview(Integer userId, SubmitReviewRequest req) {
        ReviewScope scope = ReviewScope.valueOf(req.getReviewScope());

        // 校验目标资源存在
        if (scope == ReviewScope.COURSE && req.getCourseId() != null) {
            targetValidator.validateTargetExists(
                    com.taoke.course.enums.InteractionTargetType.COURSE, req.getCourseId());
        }
        if (scope == ReviewScope.TRAINER && req.getTrainerUserId() != null) {
            targetValidator.validateTargetExists(
                    com.taoke.course.enums.InteractionTargetType.TRAINER, req.getTrainerUserId());
        }

        TrainingReview review = new TrainingReview();
        review.setReviewScope(scope.name());
        review.setCourseId(req.getCourseId());
        review.setTrainerUserId(req.getTrainerUserId());
        review.setExpertName(req.getExpertName());
        review.setTrainingDate(req.getTrainingDate());
        review.setCourseDays(req.getCourseDays());
        review.setCourseTitle(req.getCourseTitle());
        review.setClientCompany(req.getClientCompany());
        review.setTrainingLocation(req.getTrainingLocation());
        review.setRatingContent(req.getRatingContent());
        review.setRatingTeaching(req.getRatingTeaching());
        review.setRatingService(req.getRatingService());

        BigDecimal avg = BigDecimal.valueOf(req.getRatingContent() + req.getRatingTeaching() + req.getRatingService())
                .divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
        review.setAvgScore(avg);

        review.setCommentText(req.getCommentText());

        if (req.getPhotoUrls() != null && !req.getPhotoUrls().isEmpty()) {
            try {
                review.setPhotoUrls(objectMapper.writeValueAsString(req.getPhotoUrls()));
            } catch (JsonProcessingException e) {
                review.setPhotoUrls("[]");
            }
        }

        review.setSubmitterName(req.getSubmitterName());
        review.setSubmitterContact(req.getSubmitterContact());
        review.setUserId(userId);
        review.setStatus(ReviewStatus.PENDING.getValue());
        review.setIsAnonymous(Boolean.TRUE.equals(req.getAnonymous()) ? 1 : 0);

        reviewRepository.save(review);
        return review.getId();
    }

    /**
     * 公开评价列表（仅已通过）
     */
    public PageResponse<ReviewVO> listPublicReviews(String scope, Integer courseId,
                                                     Integer trainerUserId,
                                                     int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<TrainingReview> reviewPage;

        ReviewScope reviewScope = ReviewScope.valueOf(scope);
        int approvedStatus = ReviewStatus.APPROVED.getValue();

        if (reviewScope == ReviewScope.COURSE && courseId != null) {
            reviewPage = reviewRepository.findByCourseIdAndStatusOrderByCreatedAtDesc(courseId, approvedStatus, pageable);
        } else if (reviewScope == ReviewScope.TRAINER && trainerUserId != null) {
            reviewPage = reviewRepository.findByTrainerUserIdAndStatusOrderByCreatedAtDesc(trainerUserId, approvedStatus, pageable);
        } else {
            reviewPage = reviewRepository.findByStatusOrderByCreatedAtDesc(approvedStatus, pageable);
        }

        return PageResponse.of(reviewPage.map(this::toVO));
    }

    /**
     * 我的评价列表
     */
    public PageResponse<ReviewVO> listMyReviews(Integer userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<TrainingReview> reviewPage = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.of(reviewPage.map(this::toVO));
    }

    /**
     * 统计已通过评价数
     */
    public long countApprovedReviews(String scope, Integer targetId) {
        int approved = ReviewStatus.APPROVED.getValue();
        ReviewScope reviewScope = ReviewScope.valueOf(scope);
        if (reviewScope == ReviewScope.COURSE) {
            return reviewRepository.countByCourseIdAndStatus(targetId, approved);
        } else {
            return reviewRepository.countByTrainerUserIdAndStatus(targetId, approved);
        }
    }

    /**
     * 审核通过
     */
    @Transactional
    public void approveReview(Integer reviewId) {
        TrainingReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        review.setStatus(ReviewStatus.APPROVED.getValue());
        reviewRepository.save(review);
    }

    /**
     * 审核驳回
     */
    @Transactional
    public void rejectReview(Integer reviewId, String reason) {
        TrainingReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        review.setStatus(ReviewStatus.REJECTED.getValue());
        review.setRejectReason(reason);
        reviewRepository.save(review);
    }

    /**
     * 隐藏评价
     */
    @Transactional
    public void hideReview(Integer reviewId) {
        TrainingReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        review.setStatus(ReviewStatus.HIDDEN.getValue());
        reviewRepository.save(review);
    }

    /**
     * 待审核列表
     */
    public Page<TrainingReview> listPendingReviews(int page, int size) {
        return reviewRepository.findByStatusOrderByCreatedAtDesc(
                ReviewStatus.PENDING.getValue(), PageRequest.of(page, size));
    }

    private ReviewVO toVO(TrainingReview r) {
        ReviewVO vo = new ReviewVO();
        vo.setId(r.getId());
        vo.setReviewScope(r.getReviewScope());
        vo.setCourseId(r.getCourseId());
        vo.setTrainerUserId(r.getTrainerUserId());
        vo.setExpertName(r.getExpertName());
        vo.setTrainingDate(r.getTrainingDate());
        vo.setCourseDays(r.getCourseDays());
        vo.setCourseTitle(r.getCourseTitle());
        vo.setClientCompany(r.getClientCompany());
        vo.setTrainingLocation(r.getTrainingLocation());
        vo.setRatingContent(r.getRatingContent());
        vo.setRatingTeaching(r.getRatingTeaching());
        vo.setRatingService(r.getRatingService());
        vo.setAvgScore(r.getAvgScore());
        vo.setCommentText(r.getCommentText());
        vo.setSubmitterName(r.getSubmitterName());
        vo.setIsAnonymous(r.getIsAnonymous());
        vo.setStatus(r.getStatus());
        vo.setCreatedAt(r.getCreatedAt());

        // 解析 photo_urls JSON
        if (r.getPhotoUrls() != null && !r.getPhotoUrls().isBlank()) {
            try {
                List<String> urls = objectMapper.readValue(r.getPhotoUrls(), new TypeReference<>() {});
                vo.setPhotoUrls(urls);
            } catch (JsonProcessingException e) {
                vo.setPhotoUrls(Collections.emptyList());
            }
        }
        return vo;
    }
}
