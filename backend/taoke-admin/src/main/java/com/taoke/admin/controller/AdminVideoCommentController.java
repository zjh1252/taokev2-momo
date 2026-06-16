package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminVideoCommentQuery;
import com.taoke.admin.dto.BatchIdsRequest;
import com.taoke.admin.dto.BatchRejectRequest;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminVideoCommentService;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.dto.video.AdminVideoCommentListItemVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 录播课评论管理
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Tag(name = "后台-录播课评论管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminVideoCommentController {

    private final AdminVideoCommentService adminVideoCommentService;

    @Operation(summary = "分页查询录播课评论")
    @GetMapping("/admin/video-comments")
    public ApiResponse<PageResponse<AdminVideoCommentListItemVO>> list(AdminVideoCommentQuery query) {
        return ApiResponse.ok(adminVideoCommentService.list(query));
    }

    @Operation(summary = "审核通过评论")
    @PutMapping("/admin/video-comments/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminVideoCommentService.approve(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "驳回评论")
    @PutMapping("/admin/video-comments/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminVideoCommentService.reject(id, request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "删除评论")
    @DeleteMapping("/admin/video-comments/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        adminVideoCommentService.delete(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "批量审核通过")
    @PutMapping("/admin/video-comments/batch/approve")
    public ApiResponse<Void> batchApprove(@Valid @RequestBody BatchIdsRequest request) {
        adminVideoCommentService.batchApprove(request);
        return ApiResponse.ok();
    }

    @Operation(summary = "批量驳回")
    @PutMapping("/admin/video-comments/batch/reject")
    public ApiResponse<Void> batchReject(@Valid @RequestBody BatchRejectRequest request) {
        adminVideoCommentService.batchReject(request, request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "批量删除评论")
    @DeleteMapping("/admin/video-comments/batch")
    public ApiResponse<Void> batchDelete(@Valid @RequestBody BatchIdsRequest request) {
        adminVideoCommentService.batchDelete(request);
        return ApiResponse.ok();
    }
}
