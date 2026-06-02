package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.dto.trainercase.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 专家案例控制器 — 自服务 + C端公开接口
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:00
 */
@Tag(name = "专家案例")
@RestController
@RequiredArgsConstructor
public class TrainerCaseController {

    private final TrainerCaseService trainerCaseService;
    private final BindingAuthority bindingAuthority;

    /** trainerUserId 不传时回退到当前用户自身（兼容专家本人） */
    private Integer effectiveTrainerUserId(Integer trainerUserId) {
        return bindingAuthority.resolveTargetTrainerUserId(SecurityUtils.getCurrentUserId(), trainerUserId);
    }

    // ==================== 自服务（内容管理角色） ====================

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "我的案例列表（trainerUserId 可选，用于代管）")
    @GetMapping("/trainers/me/cases")
    public ApiResponse<List<TrainerCaseResponse>> listMyCases(@RequestParam(required = false) Integer trainerUserId) {
        return ApiResponse.ok(trainerCaseService.listMyCases(effectiveTrainerUserId(trainerUserId)));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "我的案例详情")
    @GetMapping("/trainers/me/cases/{id}")
    public ApiResponse<TrainerCaseResponse> getMyCaseDetail(@PathVariable Integer id,
                                                            @RequestParam(required = false) Integer trainerUserId) {
        return ApiResponse.ok(trainerCaseService.getMyCaseDetail(effectiveTrainerUserId(trainerUserId), id));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "新增案例")
    @PostMapping("/trainers/me/cases")
    public ApiResponse<TrainerCaseResponse> createCase(@RequestParam(required = false) Integer trainerUserId,
                                                       @Valid @RequestBody SaveTrainerCaseRequest request) {
        return ApiResponse.ok(trainerCaseService.createCase(effectiveTrainerUserId(trainerUserId), request, false));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "保存案例草稿（不进入审核，允许信息不完整）")
    @PostMapping("/trainers/me/cases/draft")
    public ApiResponse<TrainerCaseResponse> createCaseDraft(@RequestParam(required = false) Integer trainerUserId,
                                                            @RequestBody SaveTrainerCaseRequest request) {
        return ApiResponse.ok(trainerCaseService.createCase(effectiveTrainerUserId(trainerUserId), request, true));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "编辑案例")
    @PutMapping("/trainers/me/cases/{id}")
    public ApiResponse<TrainerCaseResponse> updateCase(@PathVariable Integer id,
                                                       @RequestParam(required = false) Integer trainerUserId,
                                                       @Valid @RequestBody SaveTrainerCaseRequest request) {
        return ApiResponse.ok(trainerCaseService.updateCase(effectiveTrainerUserId(trainerUserId), id, request, false));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "保存案例草稿（编辑，不进入审核，允许信息不完整）")
    @PutMapping("/trainers/me/cases/{id}/draft")
    public ApiResponse<TrainerCaseResponse> updateCaseDraft(@PathVariable Integer id,
                                                            @RequestParam(required = false) Integer trainerUserId,
                                                            @RequestBody SaveTrainerCaseRequest request) {
        return ApiResponse.ok(trainerCaseService.updateCase(effectiveTrainerUserId(trainerUserId), id, request, true));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "删除案例")
    @DeleteMapping("/trainers/me/cases/{id}")
    public ApiResponse<Void> deleteCase(@PathVariable Integer id,
                                        @RequestParam(required = false) Integer trainerUserId) {
        trainerCaseService.deleteCase(effectiveTrainerUserId(trainerUserId), id);
        return ApiResponse.ok();
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "添加案例文件")
    @PostMapping("/trainers/me/cases/{id}/files")
    public ApiResponse<TrainerCaseFileResponse> addCaseFile(
            @PathVariable Integer id,
            @RequestParam(required = false) Integer trainerUserId,
            @Valid @RequestBody SaveTrainerCaseFileRequest request) {
        return ApiResponse.ok(trainerCaseService.addCaseFile(
                effectiveTrainerUserId(trainerUserId), id, request));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "删除案例文件")
    @DeleteMapping("/trainers/me/cases/{caseId}/files/{fileId}")
    public ApiResponse<Void> deleteCaseFile(@PathVariable Integer caseId,
                                            @PathVariable Integer fileId,
                                            @RequestParam(required = false) Integer trainerUserId) {
        trainerCaseService.deleteCaseFile(effectiveTrainerUserId(trainerUserId), caseId, fileId);
        return ApiResponse.ok();
    }

    // ==================== C端公开接口 ====================

    @Public
    @Operation(summary = "某专家的已审核案例列表")
    @GetMapping("/trainers/{id}/cases")
    public ApiResponse<List<TrainerCaseResponse>> listApprovedCases(@PathVariable Integer id) {
        return ApiResponse.ok(trainerCaseService.listApprovedCases(id));
    }

    @Public
    @Operation(summary = "全平台最近的已审核案例（用于专家列表页/首页轮播位）")
    @GetMapping("/trainer-cases/recent")
    public ApiResponse<List<TrainerCaseRecentResponse>> listRecentApproved(
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(trainerCaseService.listRecentApproved(limit));
    }
}
