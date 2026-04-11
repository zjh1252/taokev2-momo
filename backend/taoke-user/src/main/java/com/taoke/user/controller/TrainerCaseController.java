package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
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

    // ==================== 专家自服务（需 TRAINER 角色） ====================

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "我的案例列表")
    @GetMapping("/trainers/me/cases")
    public ApiResponse<List<TrainerCaseResponse>> listMyCases() {
        return ApiResponse.ok(trainerCaseService.listMyCases(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "我的案例详情")
    @GetMapping("/trainers/me/cases/{id}")
    public ApiResponse<TrainerCaseResponse> getMyCaseDetail(@PathVariable Integer id) {
        return ApiResponse.ok(trainerCaseService.getMyCaseDetail(SecurityUtils.getCurrentUserId(), id));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "新增案例")
    @PostMapping("/trainers/me/cases")
    public ApiResponse<TrainerCaseResponse> createCase(@Valid @RequestBody SaveTrainerCaseRequest request) {
        return ApiResponse.ok(trainerCaseService.createCase(SecurityUtils.getCurrentUserId(), request));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "编辑案例")
    @PutMapping("/trainers/me/cases/{id}")
    public ApiResponse<TrainerCaseResponse> updateCase(@PathVariable Integer id,
                                                       @Valid @RequestBody SaveTrainerCaseRequest request) {
        return ApiResponse.ok(trainerCaseService.updateCase(SecurityUtils.getCurrentUserId(), id, request));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "删除案例")
    @DeleteMapping("/trainers/me/cases/{id}")
    public ApiResponse<Void> deleteCase(@PathVariable Integer id) {
        trainerCaseService.deleteCase(SecurityUtils.getCurrentUserId(), id);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "添加案例文件")
    @PostMapping("/trainers/me/cases/{id}/files")
    public ApiResponse<TrainerCaseFileResponse> addCaseFile(
            @PathVariable Integer id,
            @Valid @RequestBody SaveTrainerCaseFileRequest request) {
        return ApiResponse.ok(trainerCaseService.addCaseFile(
                SecurityUtils.getCurrentUserId(), id, request));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "删除案例文件")
    @DeleteMapping("/trainers/me/cases/{caseId}/files/{fileId}")
    public ApiResponse<Void> deleteCaseFile(@PathVariable Integer caseId,
                                            @PathVariable Integer fileId) {
        trainerCaseService.deleteCaseFile(SecurityUtils.getCurrentUserId(), caseId, fileId);
        return ApiResponse.ok();
    }

    // ==================== C端公开接口 ====================

    @Public
    @Operation(summary = "某专家的已审核案例列表")
    @GetMapping("/trainers/{id}/cases")
    public ApiResponse<List<TrainerCaseResponse>> listApprovedCases(@PathVariable Integer id) {
        return ApiResponse.ok(trainerCaseService.listApprovedCases(id));
    }
}
