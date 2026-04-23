package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.TrainerCertificationService;
import com.taoke.user.dto.trainer.TrainerEducationDTO;
import com.taoke.user.dto.trainer.TrainerWorkExperienceDTO;
import com.taoke.user.dto.trainer.cert.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 专家四维度资质认证（C 端）— 实名 / 专业 / 学历 / 工作。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Tag(name = "专家-资质认证", description = "实名 / 专业 / 学历 / 工作 认证")
@RestController
@RequiredArgsConstructor
@RequireRole(BusinessRole.Code.TRAINER)
public class TrainerCertificationController {

    private final TrainerCertificationService certificationService;

    // ==================== 实名认证 ====================

    @Operation(summary = "查询本人实名认证状态")
    @GetMapping("/trainers/me/certification/real-name")
    public ApiResponse<RealNameCertResponse> getRealName() {
        return ApiResponse.ok(certificationService.getRealName(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "提交/重新提交实名认证")
    @PutMapping("/trainers/me/certification/real-name")
    public ApiResponse<Void> submitRealName(@Valid @RequestBody RealNameCertRequest request) {
        certificationService.submitRealName(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    // ==================== 专业认证 ====================

    @Operation(summary = "查询本人专业认证状态")
    @GetMapping("/trainers/me/certification/professional")
    public ApiResponse<ProfessionalCertResponse> getProfessional() {
        return ApiResponse.ok(certificationService.getProfessional(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "提交/重新提交专业认证")
    @PutMapping("/trainers/me/certification/professional")
    public ApiResponse<Void> submitProfessional(@Valid @RequestBody ProfessionalCertRequest request) {
        certificationService.submitProfessional(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    // ==================== 学历认证 ====================

    @Operation(summary = "查询本人学历认证记录列表")
    @GetMapping("/trainers/me/certification/educations")
    public ApiResponse<List<TrainerEducationDTO>> listEducations() {
        return ApiResponse.ok(certificationService.listEducations(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "新增学历认证记录")
    @PostMapping("/trainers/me/certification/educations")
    public ApiResponse<TrainerEducationDTO> createEducation(@Valid @RequestBody EducationCertRequest request) {
        return ApiResponse.ok(certificationService.createEducation(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "更新学历认证记录（重置为待审核）")
    @PutMapping("/trainers/me/certification/educations/{id}")
    public ApiResponse<TrainerEducationDTO> updateEducation(@PathVariable Integer id,
                                                            @Valid @RequestBody EducationCertRequest request) {
        return ApiResponse.ok(certificationService.updateEducation(SecurityUtils.getRequiredUserId(), id, request));
    }

    @Operation(summary = "删除学历认证记录")
    @DeleteMapping("/trainers/me/certification/educations/{id}")
    public ApiResponse<Void> deleteEducation(@PathVariable Integer id) {
        certificationService.deleteEducation(SecurityUtils.getRequiredUserId(), id);
        return ApiResponse.ok(null);
    }

    // ==================== 工作认证 ====================

    @Operation(summary = "查询本人工作认证记录列表")
    @GetMapping("/trainers/me/certification/work-experiences")
    public ApiResponse<List<TrainerWorkExperienceDTO>> listWorkExperiences() {
        return ApiResponse.ok(certificationService.listWorkExperiences(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "新增工作认证记录")
    @PostMapping("/trainers/me/certification/work-experiences")
    public ApiResponse<TrainerWorkExperienceDTO> createWorkExperience(@Valid @RequestBody WorkCertRequest request) {
        return ApiResponse.ok(certificationService.createWorkExperience(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "更新工作认证记录（重置为待审核）")
    @PutMapping("/trainers/me/certification/work-experiences/{id}")
    public ApiResponse<TrainerWorkExperienceDTO> updateWorkExperience(@PathVariable Integer id,
                                                                      @Valid @RequestBody WorkCertRequest request) {
        return ApiResponse.ok(certificationService.updateWorkExperience(SecurityUtils.getRequiredUserId(), id, request));
    }

    @Operation(summary = "删除工作认证记录")
    @DeleteMapping("/trainers/me/certification/work-experiences/{id}")
    public ApiResponse<Void> deleteWorkExperience(@PathVariable Integer id) {
        certificationService.deleteWorkExperience(SecurityUtils.getRequiredUserId(), id);
        return ApiResponse.ok(null);
    }
}
