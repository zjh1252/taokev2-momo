package com.taoke.admin.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.admin.dto.AdminReviewVO;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.entity.interaction.TrainingReview;
import com.taoke.course.service.interaction.ReviewServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * 后台管理 — 培训评价审核
 *
 * @author Fangxinxin
 * @date 2026-04-22 12:00
 */
@Tag(name = "后台-培训评价管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewServiceImpl reviewService;
    private final ObjectMapper objectMapper;

    @Operation(summary = "分页查询培训评价")
    @GetMapping("/admin/training-reviews")
    public ApiResponse<PageResponse<AdminReviewVO>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String reviewScope,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TrainingReview> result = reviewService.adminListReviews(status, reviewScope, page, size);
        List<AdminReviewVO> list = result.getContent().stream().map(this::toAdminVo).toList();
        return ApiResponse.ok(PageResponse.of(list, result.getTotalElements(), page, size));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/training-reviews/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        reviewService.approveReview(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/training-reviews/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        reviewService.rejectReview(id, request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "隐藏评价")
    @PutMapping("/admin/training-reviews/{id}/hide")
    public ApiResponse<Void> hide(@PathVariable Integer id) {
        reviewService.hideReview(id);
        return ApiResponse.ok();
    }

    private AdminReviewVO toAdminVo(TrainingReview r) {
        AdminReviewVO vo = new AdminReviewVO();
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
        vo.setUserId(r.getUserId());
        vo.setRejectReason(r.getRejectReason());
        vo.setSubmitterContact(r.getSubmitterContact());

        if (r.getPhotoUrls() != null && !r.getPhotoUrls().isBlank()) {
            try {
                List<String> urls = objectMapper.readValue(r.getPhotoUrls(), new TypeReference<>() {});
                vo.setPhotoUrls(urls);
            } catch (JsonProcessingException e) {
                vo.setPhotoUrls(Collections.emptyList());
            }
        } else {
            vo.setPhotoUrls(Collections.emptyList());
        }
        return vo;
    }
}
