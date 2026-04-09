package com.taoke.admin.controller;

import com.taoke.admin.dto.*;
import com.taoke.admin.service.AdminInstitutionService;
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
 * 后台 — 机构管理（列表 + 申请审核 + 培训协会标识）。
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:00
 */
@Tag(name = "后台-机构管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminInstitutionController {

    private final AdminInstitutionService adminInstitutionService;

    @Operation(summary = "分页查询机构列表")
    @GetMapping("/admin/institutions")
    public ApiResponse<PageResult<AdminInstitutionVO>> list(AdminInstitutionQuery query) {
        return ApiResponse.ok(adminInstitutionService.listInstitutions(query));
    }

    @Operation(summary = "分页查询机构申请列表")
    @GetMapping("/admin/institutions/applications")
    public ApiResponse<PageResult<AdminInstitutionApplicationVO>> listApplications(AdminInstitutionApplicationQuery query) {
        return ApiResponse.ok(adminInstitutionService.listApplications(query));
    }

    @Operation(summary = "审核通过机构申请")
    @PutMapping("/admin/institutions/applications/{userId}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer userId) {
        adminInstitutionService.approveApplication(userId);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回机构申请")
    @PutMapping("/admin/institutions/applications/{userId}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer userId,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminInstitutionService.rejectApplication(userId, request.getReason());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "设为/取消培训协会")
    @PutMapping("/admin/institutions/{id}/association")
    public ApiResponse<Void> setAssociation(@PathVariable Integer id,
                                            @Valid @RequestBody SetAssociationRequest request) {
        adminInstitutionService.setAssociation(id, request.getAssociation());
        return ApiResponse.ok(null);
    }
}
