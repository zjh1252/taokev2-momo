package com.taoke.admin.controller;

import com.taoke.admin.dto.*;
import com.taoke.admin.service.AdminAssistantService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 专家助理管理（列表 + 申请审核）。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Tag(name = "后台-专家助理管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminAssistantController {

    private final AdminAssistantService adminAssistantService;

    @Operation(summary = "分页查询助理列表")
    @GetMapping("/admin/assistants")
    public ApiResponse<PageResult<AdminAssistantVO>> list(AdminAssistantQuery query) {
        return ApiResponse.ok(adminAssistantService.listAssistants(query));
    }

    @Operation(summary = "分页查询助理申请列表")
    @GetMapping("/admin/assistants/applications")
    public ApiResponse<PageResult<AdminAssistantApplicationVO>> listApplications(
            AdminAssistantApplicationQuery query) {
        return ApiResponse.ok(adminAssistantService.listApplications(query));
    }

    @Operation(summary = "审核通过助理申请")
    @PutMapping("/admin/assistants/applications/{userId}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer userId) {
        adminAssistantService.approveApplication(userId);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回助理申请")
    @PutMapping("/admin/assistants/applications/{userId}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer userId,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminAssistantService.rejectApplication(userId, request.getReason());
        return ApiResponse.ok(null);
    }
}
