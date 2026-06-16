package com.taoke.admin.controller;

import com.taoke.admin.dto.*;
import com.taoke.admin.service.AdminEnterpriseBuyerService;
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
 * 后台 — 企业采购方管理（列表 + 申请审核）。
 *
 * @author Fangxinxin
 * @date 2026-04-09 17:00
 */
@Tag(name = "后台-企业采购方管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminEnterpriseBuyerController {

    private final AdminEnterpriseBuyerService adminEnterpriseBuyerService;

    @Operation(summary = "分页查询企业采购方列表")
    @GetMapping("/admin/enterprise-buyers")
    public ApiResponse<PageResult<AdminEnterpriseBuyerVO>> list(AdminEnterpriseBuyerQuery query) {
        return ApiResponse.ok(adminEnterpriseBuyerService.listEnterpriseBuyers(query));
    }

    @Operation(summary = "分页查询企业采购方申请列表")
    @GetMapping("/admin/enterprise-buyers/applications")
    public ApiResponse<PageResult<AdminEnterpriseBuyerApplicationVO>> listApplications(
            AdminEnterpriseBuyerApplicationQuery query) {
        return ApiResponse.ok(adminEnterpriseBuyerService.listApplications(query));
    }

    @Operation(summary = "审核通过企业采购方申请")
    @PutMapping("/admin/enterprise-buyers/applications/{userId}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer userId) {
        adminEnterpriseBuyerService.approveApplication(userId);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回企业采购方申请")
    @PutMapping("/admin/enterprise-buyers/applications/{userId}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer userId,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminEnterpriseBuyerService.rejectApplication(userId, request.getReason());
        return ApiResponse.ok(null);
    }
}
