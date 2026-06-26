package com.taoke.course.controller.interaction;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.interaction.ReviewVO;
import com.taoke.course.dto.interaction.SubmitReviewRequest;
import com.taoke.course.service.interaction.ReviewServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 培训评价接口
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Tag(name = "评价", description = "培训评价提交与列表")
@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewServiceImpl reviewService;

    @Operation(summary = "提交评价")
    @PostMapping("/interaction/reviews")
    public ApiResponse<Integer> submitReview(@Valid @RequestBody SubmitReviewRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        Integer reviewId = reviewService.submitReview(userId, request);
        return ApiResponse.ok(reviewId);
    }

    @Public
    @Operation(summary = "公开评价列表（仅已通过）")
    @GetMapping("/interaction/reviews")
    public ApiResponse<PageResponse<ReviewVO>> listPublicReviews(
            @RequestParam String scope,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) Integer trainerUserId,
            @RequestParam(required = false) Integer institutionId,
            @RequestParam(required = false) Integer caseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(reviewService.listPublicReviews(
                scope, courseId, trainerUserId, institutionId, caseId, page, size));
    }

    @Operation(summary = "我的评价列表")
    @GetMapping("/interaction/reviews/mine")
    public ApiResponse<PageResponse<ReviewVO>> listMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(reviewService.listMyReviews(userId, page, size));
    }
}
