package com.taoke.course.service.interaction;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.review.ReviewApprovedEvent;
import com.taoke.common.events.review.ReviewHiddenEvent;
import com.taoke.common.events.review.ReviewRejectedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.interaction.ReviewVO;
import com.taoke.course.dto.interaction.SubmitReviewRequest;
import com.taoke.course.entity.interaction.TrainingReview;
import com.taoke.course.enums.ReviewScope;
import com.taoke.course.enums.ReviewStatus;
import com.taoke.course.repository.interaction.TrainingReviewRepository;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
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
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final EventPublisher eventPublisher;

    /**
     * 提交评价（状态为 PENDING）
     * <p>支持三种 scope：COURSE / TRAINER / INSTITUTION，对应字段必填校验在此完成。</p>
     */
    @Transactional
    public Integer submitReview(Integer userId, SubmitReviewRequest req) {
        ReviewScope scope = ReviewScope.valueOf(req.getReviewScope());

        // 校验目标资源存在 + 必填字段
        if (scope == ReviewScope.COURSE) {
            if (req.getCourseId() == null) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "课程评价必须指定 courseId");
            }
            targetValidator.validateTargetExists(
                    com.taoke.course.enums.InteractionTargetType.COURSE, req.getCourseId());
        } else if (scope == ReviewScope.TRAINER) {
            if (req.getTrainerUserId() == null) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "专家评价必须指定 trainerUserId");
            }
            targetValidator.validateTargetExists(
                    com.taoke.course.enums.InteractionTargetType.TRAINER, req.getTrainerUserId());
        } else if (scope == ReviewScope.INSTITUTION) {
            if (req.getInstitutionId() == null) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "机构评价必须指定 institutionId");
            }
            targetValidator.validateTargetExists(
                    com.taoke.course.enums.InteractionTargetType.INSTITUTION, req.getInstitutionId());
        } else if (scope == ReviewScope.CASE) {
            if (req.getCaseId() == null) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "案例评价必须指定 caseId");
            }
            targetValidator.validateTargetExists(
                    com.taoke.course.enums.InteractionTargetType.CASE, req.getCaseId());
        }

        TrainingReview review = new TrainingReview();
        review.setReviewScope(scope.name());
        review.setCourseId(req.getCourseId());
        review.setTrainerUserId(req.getTrainerUserId());
        review.setInstitutionId(req.getInstitutionId());
        review.setCaseId(req.getCaseId());
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
        review.setAnonymous(Boolean.TRUE.equals(req.getAnonymous()));

        reviewRepository.save(review);
        return review.getId();
    }

    /**
     * 公开评价列表（仅已通过）
     */
    public PageResponse<ReviewVO> listPublicReviews(String scope, Integer courseId,
                                                     Integer trainerUserId,
                                                     Integer institutionId,
                                                     Integer caseId,
                                                     int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<TrainingReview> reviewPage;

        ReviewScope reviewScope = ReviewScope.valueOf(scope);
        int approvedStatus = ReviewStatus.APPROVED.getValue();

        if (reviewScope == ReviewScope.COURSE && courseId != null) {
            reviewPage = reviewRepository.findByCourseIdAndStatusOrderByCreatedAtDesc(courseId, approvedStatus, pageable);
        } else if (reviewScope == ReviewScope.TRAINER && trainerUserId != null) {
            reviewPage = reviewRepository.findByTrainerUserIdAndStatusOrderByCreatedAtDesc(trainerUserId, approvedStatus, pageable);
        } else if (reviewScope == ReviewScope.INSTITUTION && institutionId != null) {
            reviewPage = reviewRepository.findByInstitutionIdAndStatusOrderByCreatedAtDesc(institutionId, approvedStatus, pageable);
        } else if (reviewScope == ReviewScope.CASE && caseId != null) {
            reviewPage = reviewRepository.findByCaseIdAndStatusOrderByCreatedAtDesc(caseId, approvedStatus, pageable);
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
        return switch (reviewScope) {
            case COURSE -> reviewRepository.countByCourseIdAndStatus(targetId, approved);
            case VIDEO -> reviewRepository.countByCourseIdAndStatus(targetId, approved);
            case TRAINER -> reviewRepository.countByTrainerUserIdAndStatus(targetId, approved);
            case INSTITUTION -> reviewRepository.countByInstitutionIdAndStatus(targetId, approved);
            case CASE -> reviewRepository.countByCaseIdAndStatus(targetId, approved);
        };
    }

    /**
     * 审核通过
     * <p>状态变化时同步累计评论数：原状态非 APPROVED → APPROVED 则 +1。</p>
     */
    @Transactional
    public void approveReview(Integer reviewId, Integer reviewerUserId) {
        TrainingReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        int prev = review.getStatus() == null ? -1 : review.getStatus();
        review.setStatus(ReviewStatus.APPROVED.getValue());
        if (reviewerUserId != null) {
            review.setReviewedBy(reviewerUserId);
            review.setReviewedAt(java.time.LocalDateTime.now());
        }
        reviewRepository.save(review);
        if (prev != ReviewStatus.APPROVED.getValue()) {
            adjustTargetCommentCount(review, +1);
        }
        eventPublisher.publish(new ReviewApprovedEvent(
                review.getId(),
                review.getUserId(),
                review.getReviewScope(),
                resolveTargetId(review),
                resolveTargetTitle(review)
        ));
    }

    /**
     * 审核驳回
     * <p>若原状态是 APPROVED → REJECTED，需 -1 同步累计评论数。</p>
     */
    @Transactional
    public void rejectReview(Integer reviewId, String reason, Integer reviewerUserId) {
        TrainingReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        int prev = review.getStatus() == null ? -1 : review.getStatus();
        review.setStatus(ReviewStatus.REJECTED.getValue());
        review.setRejectReason(reason);
        if (reviewerUserId != null) {
            review.setReviewedBy(reviewerUserId);
            review.setReviewedAt(java.time.LocalDateTime.now());
        }
        reviewRepository.save(review);
        if (prev == ReviewStatus.APPROVED.getValue()) {
            adjustTargetCommentCount(review, -1);
        }
        eventPublisher.publish(new ReviewRejectedEvent(
                review.getId(),
                review.getUserId(),
                review.getReviewScope(),
                resolveTargetId(review),
                resolveTargetTitle(review),
                reason
        ));
    }

    /**
     * 隐藏评价
     * <p>若原状态是 APPROVED → HIDDEN，需 -1 同步累计评论数。</p>
     */
    @Transactional
    public void hideReview(Integer reviewId) {
        TrainingReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        int prev = review.getStatus() == null ? -1 : review.getStatus();
        review.setStatus(ReviewStatus.HIDDEN.getValue());
        reviewRepository.save(review);
        if (prev == ReviewStatus.APPROVED.getValue()) {
            adjustTargetCommentCount(review, -1);
        }
        eventPublisher.publish(new ReviewHiddenEvent(
                review.getId(),
                review.getUserId(),
                review.getReviewScope(),
                resolveTargetId(review),
                resolveTargetTitle(review)
        ));
    }

    /**
     * 取出评价对应的被评对象 ID（依据 scope 字段映射）
     */
    private Integer resolveTargetId(TrainingReview review) {
        if (review == null || review.getReviewScope() == null) return null;
        return switch (ReviewScope.valueOf(review.getReviewScope())) {
            case COURSE, VIDEO -> review.getCourseId();
            case TRAINER -> review.getTrainerUserId();
            case INSTITUTION -> review.getInstitutionId();
            case CASE -> review.getCaseId();
        };
    }

    /**
     * 评价标题摘要 — 用于通知文案展示。
     * <p>优先使用评价填写的 {@code courseTitle} / {@code expertName} 等字段，
     * 取不到时返回空串，由消费者按 scope + targetId 自行兜底。</p>
     */
    private String resolveTargetTitle(TrainingReview review) {
        if (review == null || review.getReviewScope() == null) return "";
        return switch (ReviewScope.valueOf(review.getReviewScope())) {
            case COURSE, VIDEO -> review.getCourseTitle() != null ? review.getCourseTitle() : "";
            case TRAINER -> review.getExpertName() != null ? review.getExpertName() : "";
            case INSTITUTION -> review.getClientCompany() != null ? review.getClientCompany() : "";
            case CASE -> review.getCourseTitle() != null ? review.getCourseTitle() : "";
        };
    }

    /**
     * 按 review.scope 同步对应被评对象的 comment_count。
     * <p>COURSE 暂未维护该字段，仅处理 TRAINER 与 INSTITUTION。</p>
     */
    private void adjustTargetCommentCount(TrainingReview review, int delta) {
        if (review == null || delta == 0) return;
        ReviewScope scope = ReviewScope.valueOf(review.getReviewScope());
        switch (scope) {
            case TRAINER -> {
                if (review.getTrainerUserId() != null) {
                    trainerService.adjustCommentCountByUserId(review.getTrainerUserId(), delta);
                }
            }
            case INSTITUTION -> {
                if (review.getInstitutionId() != null) {
                    institutionService.adjustCommentCount(review.getInstitutionId(), delta);
                }
            }
            case COURSE, VIDEO -> {
                // courses / videos 表暂未维护 comment_count，跳过
            }
            case CASE -> {
                // 案例暂未维护 comment_count，跳过
            }
        }
    }

    /**
     * 待审核列表
     */
    public Page<TrainingReview> listPendingReviews(int page, int size) {
        return reviewRepository.findByStatusOrderByCreatedAtDesc(
                ReviewStatus.PENDING.getValue(), PageRequest.of(page, size));
    }

    /**
     * 管理后台分页查询（可选按状态、评价范围过滤）
     * <p>{@code page} 为 1-based，与后台其他列表接口一致。</p>
     *
     * @param status       审核状态，{@code null} 表示全部
     * @param reviewScope  评价范围 COURSE/TRAINER/INSTITUTION，{@code null} 或空串表示全部
     */
    public Page<TrainingReview> adminListReviews(Integer status, String reviewScope,
                                                 String reviewerKeyword, Integer reviewedBy,
                                                 List<Integer> reviewedByUserIds,
                                                 int page, int size) {
        int pageOneBased = page < 1 ? 1 : page;

        final String scopeForFilter;
        if (reviewScope == null || reviewScope.isBlank()) {
            scopeForFilter = null;
        } else {
            String trimmed = reviewScope.trim();
            ReviewScope.valueOf(trimmed);
            scopeForFilter = trimmed;
        }

        Specification<TrainingReview> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (scopeForFilter != null) {
                predicates.add(cb.equal(root.get("reviewScope"), scopeForFilter));
            }
            if (reviewedBy != null) {
                predicates.add(cb.equal(root.get("reviewedBy"), reviewedBy));
            } else if (reviewedByUserIds != null) {
                if (reviewedByUserIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(root.get("reviewedBy").in(reviewedByUserIds));
                }
            }
            if (reviewerKeyword != null && !reviewerKeyword.isBlank()) {
                String like = "%" + reviewerKeyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("submitterName"), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        PageRequest pageable = PageRequest.of(pageOneBased - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return reviewRepository.findAll(spec, pageable);
    }

    /** 兼容旧调用 */
    public void approveReview(Integer reviewId) {
        approveReview(reviewId, null);
    }

    /** 兼容旧调用 */
    public void rejectReview(Integer reviewId, String reason) {
        rejectReview(reviewId, reason, null);
    }

    /**
     * 后台评价详情
     */
    public TrainingReview getReviewForAdmin(Integer reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "评价不存在"));
    }

    private ReviewVO toVO(TrainingReview r) {
        ReviewVO vo = new ReviewVO();
        vo.setId(r.getId());
        vo.setReviewScope(r.getReviewScope());
        vo.setCourseId(r.getCourseId());
        vo.setTrainerUserId(r.getTrainerUserId());
        vo.setInstitutionId(r.getInstitutionId());
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
        vo.setAnonymous(r.getAnonymous());
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
