package com.taoke.admin.controller;

import com.taoke.admin.dto.*;
import com.taoke.admin.service.AdminEnterpriseAgentService;
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
 * 后台 — 专家经纪公司管理（列表 + 申请审核）。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Tag(name = "后台-专家经纪公司管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminEnterpriseAgentController {

    private final AdminEnterpriseAgentService adminEnterpriseAgentService;

    @Operation(summary = "分页查询经纪公司列表")
    @GetMapping("/admin/enterprise-agents")
    public ApiResponse<PageResult<AdminEnterpriseAgentVO>> list(AdminEnterpriseAgentQuery query) {
        return ApiResponse.ok(adminEnterpriseAgentService.listEnterpriseAgents(query));
    }

    @Operation(summary = "分页查询经纪公司申请列表")
    @GetMapping("/admin/enterprise-agents/applications")
    public ApiResponse<PageResult<AdminEnterpriseAgentApplicationVO>> listApplications(
            AdminEnterpriseAgentApplicationQuery query) {
        return ApiResponse.ok(adminEnterpriseAgentService.listApplications(query));
    }

    @Operation(summary = "审核通过经纪公司申请")
    @PutMapping("/admin/enterprise-agents/applications/{userId}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer userId) {
        adminEnterpriseAgentService.approveApplication(userId);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回经纪公司申请")
    @PutMapping("/admin/enterprise-agents/applications/{userId}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer userId,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminEnterpriseAgentService.rejectApplication(userId, request.getReason());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "经纪公司申请详情")
    @GetMapping("/admin/enterprise-agents/applications/{userId}/detail")
    public ApiResponse<AdminApplicationDetailVO> applicationDetail(@PathVariable Integer userId) {
        return ApiResponse.ok(adminEnterpriseAgentService.getApplicationDetail(userId));
    }
}
