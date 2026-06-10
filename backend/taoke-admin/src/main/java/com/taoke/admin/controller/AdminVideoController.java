package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminVideoQuery;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminVideoService;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.dto.video.VideoDetailVO;
import com.taoke.course.dto.video.VideoListItemVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 录播课管理（列表 + 审核 + 下架）
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:30
 */
@Tag(name = "后台-录播课管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminVideoController {

    private final AdminVideoService adminVideoService;

    @Operation(summary = "分页查询录播课列表")
    @GetMapping("/admin/videos")
    public ApiResponse<PageResponse<VideoListItemVO>> list(AdminVideoQuery query) {
        return ApiResponse.ok(adminVideoService.listVideos(query));
    }

    @Operation(summary = "录播课详情")
    @GetMapping("/admin/videos/{id}")
    public ApiResponse<VideoDetailVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminVideoService.getDetail(id));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/videos/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminVideoService.approve(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/videos/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminVideoService.reject(id, request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "后台下架录播课")
    @PutMapping("/admin/videos/{id}/unpublish")
    public ApiResponse<Void> unpublish(@PathVariable Integer id) {
        adminVideoService.unpublish(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "后台重新上架录播课")
    @PutMapping("/admin/videos/{id}/publish")
    public ApiResponse<Void> publish(@PathVariable Integer id) {
        adminVideoService.publish(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "推荐录播课（列表置顶或列表推荐）")
    @PutMapping("/admin/videos/{id}/feature")
    public ApiResponse<Void> feature(@PathVariable Integer id,
                                     @RequestParam(defaultValue = "recommend") String type) {
        adminVideoService.feature(id, type);
        return ApiResponse.ok();
    }

    @Operation(summary = "取消录播课推荐")
    @PutMapping("/admin/videos/{id}/unfeature")
    public ApiResponse<Void> unfeature(@PathVariable Integer id) {
        adminVideoService.unfeature(id);
        return ApiResponse.ok();
    }
}
