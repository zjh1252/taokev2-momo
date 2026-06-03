package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.TrainerHighlightService;
import com.taoke.user.dto.trainerhighlight.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 专家精彩瞬间 — 专家自服务接口 + C端公开接口
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Tag(name = "专家精彩瞬间")
@RestController
@RequiredArgsConstructor
public class TrainerHighlightController {

    private final TrainerHighlightService highlightService;
    private final BindingAuthority bindingAuthority;

    private Integer effectiveTrainerUserId(Integer trainerUserId) {
        return bindingAuthority.resolveTargetTrainerUserId(SecurityUtils.getCurrentUserId(), trainerUserId);
    }

    // ==================== 自服务（内容管理角色） ====================

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "我的精彩瞬间列表（trainerUserId 可选，用于代管）")
    @GetMapping("/trainers/me/highlights")
    public ApiResponse<List<TrainerHighlightResponse>> listMyHighlights(@RequestParam(required = false) Integer trainerUserId) {
        return ApiResponse.ok(highlightService.listMyHighlights(effectiveTrainerUserId(trainerUserId)));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "新建精彩瞬间")
    @PostMapping("/trainers/me/highlights")
    public ApiResponse<TrainerHighlightResponse> createHighlight(
            @RequestParam(required = false) Integer trainerUserId,
            @Valid @RequestBody SaveTrainerHighlightRequest request) {
        return ApiResponse.ok(highlightService.createHighlight(effectiveTrainerUserId(trainerUserId), request, false));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "保存精彩瞬间草稿（不进入审核，允许信息不完整）")
    @PostMapping("/trainers/me/highlights/draft")
    public ApiResponse<TrainerHighlightResponse> createHighlightDraft(
            @RequestParam(required = false) Integer trainerUserId,
            @RequestBody SaveTrainerHighlightRequest request) {
        return ApiResponse.ok(highlightService.createHighlight(effectiveTrainerUserId(trainerUserId), request, true));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "更新精彩瞬间")
    @PutMapping("/trainers/me/highlights/{id}")
    public ApiResponse<TrainerHighlightResponse> updateHighlight(
            @PathVariable Integer id,
            @RequestParam(required = false) Integer trainerUserId,
            @Valid @RequestBody SaveTrainerHighlightRequest request) {
        return ApiResponse.ok(highlightService.updateHighlight(effectiveTrainerUserId(trainerUserId), id, request, false));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "保存精彩瞬间草稿（编辑，不进入审核，允许信息不完整）")
    @PutMapping("/trainers/me/highlights/{id}/draft")
    public ApiResponse<TrainerHighlightResponse> updateHighlightDraft(
            @PathVariable Integer id,
            @RequestParam(required = false) Integer trainerUserId,
            @RequestBody SaveTrainerHighlightRequest request) {
        return ApiResponse.ok(highlightService.updateHighlight(effectiveTrainerUserId(trainerUserId), id, request, true));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "删除精彩瞬间")
    @DeleteMapping("/trainers/me/highlights/{id}")
    public ApiResponse<Void> deleteHighlight(@PathVariable Integer id,
                                             @RequestParam(required = false) Integer trainerUserId) {
        highlightService.deleteHighlight(effectiveTrainerUserId(trainerUserId), id);
        return ApiResponse.ok(null);
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "批量排序")
    @PutMapping("/trainers/me/highlights/sort")
    public ApiResponse<Void> batchSort(@RequestParam(required = false) Integer trainerUserId,
                                       @RequestBody List<Integer> ids) {
        highlightService.batchSort(effectiveTrainerUserId(trainerUserId), ids);
        return ApiResponse.ok(null);
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "添加文件到精彩瞬间")
    @PostMapping("/trainers/me/highlights/{id}/files")
    public ApiResponse<TrainerHighlightFileResponse> addHighlightFile(
            @PathVariable Integer id,
            @RequestParam(required = false) Integer trainerUserId,
            @Valid @RequestBody SaveTrainerHighlightFileRequest request) {
        return ApiResponse.ok(
                highlightService.addHighlightFile(effectiveTrainerUserId(trainerUserId), id, request));
    }

    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE, BusinessRole.Code.ENTERPRISE_AGENT})
    @Operation(summary = "删除精彩瞬间中的文件")
    @DeleteMapping("/trainers/me/highlights/{highlightId}/files/{fileId}")
    public ApiResponse<Void> deleteHighlightFile(
            @PathVariable Integer highlightId,
            @PathVariable Integer fileId,
            @RequestParam(required = false) Integer trainerUserId) {
        highlightService.deleteHighlightFile(effectiveTrainerUserId(trainerUserId), highlightId, fileId);
        return ApiResponse.ok(null);
    }

    // ==================== C端公开接口 ====================

    @Public
    @Operation(summary = "某个专家已通过的精彩瞬间")
    @GetMapping("/trainers/{id}/highlights")
    public ApiResponse<List<TrainerHighlightResponse>> listApprovedHighlights(
            @PathVariable Integer id) {
        return ApiResponse.ok(highlightService.listApprovedHighlights(id));
    }
}
