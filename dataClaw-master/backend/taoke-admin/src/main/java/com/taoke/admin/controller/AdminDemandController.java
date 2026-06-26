package com.taoke.admin.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.DemandService;
import com.taoke.course.dto.demand.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 需求管理（列表 + 详情 + 状态变更 + 跟进记录）
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Tag(name = "后台-需求管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminDemandController {

    private final DemandService demandService;

    @Operation(summary = "分页查询需求列表")
    @GetMapping("/admin/demands")
    public ApiResponse<PageResponse<DemandListResponse>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String demandType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(demandService.adminSearch(status, demandType, keyword, page, size));
    }

    @Operation(summary = "需求详情（含跟进记录）")
    @GetMapping("/admin/demands/{id}")
    public ApiResponse<DemandDetailResponse> detail(@PathVariable Integer id) {
        return ApiResponse.ok(demandService.adminGetDetail(id));
    }

    @Operation(summary = "变更需求状态")
    @PutMapping("/admin/demands/{id}/status")
    public ApiResponse<Void> changeStatus(@PathVariable Integer id,
                                           @Valid @RequestBody DemandStatusChangeRequest request) {
        demandService.changeStatus(id, request.getNewStatus(),
                request.getContent(), SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }

    @Operation(summary = "添加跟进记录")
    @PostMapping("/admin/demands/{id}/follow-ups")
    public ApiResponse<Void> addFollowUp(@PathVariable Integer id,
                                          @Valid @RequestBody AddFollowUpRequest request) {
        demandService.addFollowUp(id, request.getAction(),
                request.getContent(), SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }
}
