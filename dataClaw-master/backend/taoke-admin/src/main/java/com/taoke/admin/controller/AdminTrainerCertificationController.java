package com.taoke.admin.controller;

import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.dto.cert.*;
import com.taoke.admin.service.AdminTrainerCertificationService;
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
 * 后台 — 专家四维度资质认证审核（实名 / 专业 / 学历 / 工作）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Tag(name = "后台-专家资质认证审核")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminTrainerCertificationController {

    private final AdminTrainerCertificationService service;

    // ==================== 实名认证 ====================

    @Operation(summary = "分页查询实名认证审核列表")
    @GetMapping("/admin/trainers/certifications/real-name")
    public ApiResponse<PageResult<AdminRealNameCertVO>> listRealName(AdminTrainerCertQuery query) {
        return ApiResponse.ok(service.listRealName(query));
    }

    @Operation(summary = "通过实名认证")
    @PutMapping("/admin/trainers/certifications/real-name/{trainerId}/approve")
    public ApiResponse<Void> approveRealName(@PathVariable Integer trainerId) {
        service.auditRealName(trainerId, true, null);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回实名认证")
    @PutMapping("/admin/trainers/certifications/real-name/{trainerId}/reject")
    public ApiResponse<Void> rejectRealName(@PathVariable Integer trainerId,
                                            @Valid @RequestBody RejectApplicationRequest req) {
        service.auditRealName(trainerId, false, req.getReason());
        return ApiResponse.ok(null);
    }

    // ==================== 专业认证 ====================

    @Operation(summary = "分页查询专业认证审核列表")
    @GetMapping("/admin/trainers/certifications/professional")
    public ApiResponse<PageResult<AdminProfessionalCertVO>> listProfessional(AdminTrainerCertQuery query) {
        return ApiResponse.ok(service.listProfessional(query));
    }

    @Operation(summary = "通过专业认证")
    @PutMapping("/admin/trainers/certifications/professional/{trainerId}/approve")
    public ApiResponse<Void> approveProfessional(@PathVariable Integer trainerId) {
        service.auditProfessional(trainerId, true, null);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回专业认证")
    @PutMapping("/admin/trainers/certifications/professional/{trainerId}/reject")
    public ApiResponse<Void> rejectProfessional(@PathVariable Integer trainerId,
                                                @Valid @RequestBody RejectApplicationRequest req) {
        service.auditProfessional(trainerId, false, req.getReason());
        return ApiResponse.ok(null);
    }

    // ==================== 学历认证 ====================

    @Operation(summary = "分页查询学历认证审核列表")
    @GetMapping("/admin/trainers/certifications/educations")
    public ApiResponse<PageResult<AdminEducationCertVO>> listEducations(AdminTrainerCertQuery query) {
        return ApiResponse.ok(service.listEducations(query));
    }

    @Operation(summary = "通过学历认证")
    @PutMapping("/admin/trainers/certifications/educations/{id}/approve")
    public ApiResponse<Void> approveEducation(@PathVariable Integer id) {
        service.auditEducation(id, true, null);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回学历认证")
    @PutMapping("/admin/trainers/certifications/educations/{id}/reject")
    public ApiResponse<Void> rejectEducation(@PathVariable Integer id,
                                             @Valid @RequestBody RejectApplicationRequest req) {
        service.auditEducation(id, false, req.getReason());
        return ApiResponse.ok(null);
    }

    // ==================== 工作认证 ====================

    @Operation(summary = "分页查询工作认证审核列表")
    @GetMapping("/admin/trainers/certifications/work-experiences")
    public ApiResponse<PageResult<AdminWorkCertVO>> listWorkExperiences(AdminTrainerCertQuery query) {
        return ApiResponse.ok(service.listWorkExperiences(query));
    }

    @Operation(summary = "通过工作认证")
    @PutMapping("/admin/trainers/certifications/work-experiences/{id}/approve")
    public ApiResponse<Void> approveWork(@PathVariable Integer id) {
        service.auditWorkExperience(id, true, null);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回工作认证")
    @PutMapping("/admin/trainers/certifications/work-experiences/{id}/reject")
    public ApiResponse<Void> rejectWork(@PathVariable Integer id,
                                        @Valid @RequestBody RejectApplicationRequest req) {
        service.auditWorkExperience(id, false, req.getReason());
        return ApiResponse.ok(null);
    }
}
