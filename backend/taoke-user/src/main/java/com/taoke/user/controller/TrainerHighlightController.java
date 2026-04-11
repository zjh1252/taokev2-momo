package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.TrainerHighlightService;
import com.taoke.user.dto.trainerhighlight.BatchSortRequest;
import com.taoke.user.dto.trainerhighlight.SaveTrainerHighlightRequest;
import com.taoke.user.dto.trainerhighlight.TrainerHighlightResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 专家精彩瞬间控制器 — 自服务 + C端公开接口
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Tag(name = "专家精彩瞬间")
@RestController
@RequiredArgsConstructor
public class TrainerHighlightController {

    private final TrainerHighlightService trainerHighlightService;

    // ==================== 专家自服务（需 TRAINER 角色） ====================

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "我的精彩瞬间列表")
    @GetMapping("/trainers/me/highlights")
    public ApiResponse<List<TrainerHighlightResponse>> listMyHighlights() {
        return ApiResponse.ok(trainerHighlightService.listMyHighlights(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "上传精彩瞬间")
    @PostMapping("/trainers/me/highlights")
    public ApiResponse<TrainerHighlightResponse> createHighlight(
            @Valid @RequestBody SaveTrainerHighlightRequest request) {
        return ApiResponse.ok(trainerHighlightService.createHighlight(
                SecurityUtils.getCurrentUserId(), request));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "编辑精彩瞬间")
    @PutMapping("/trainers/me/highlights/{id}")
    public ApiResponse<TrainerHighlightResponse> updateHighlight(
            @PathVariable Integer id,
            @Valid @RequestBody SaveTrainerHighlightRequest request) {
        return ApiResponse.ok(trainerHighlightService.updateHighlight(
                SecurityUtils.getCurrentUserId(), id, request));
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "删除精彩瞬间")
    @DeleteMapping("/trainers/me/highlights/{id}")
    public ApiResponse<Void> deleteHighlight(@PathVariable Integer id) {
        trainerHighlightService.deleteHighlight(SecurityUtils.getCurrentUserId(), id);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.TRAINER)
    @Operation(summary = "批量调整排序")
    @PutMapping("/trainers/me/highlights/sort")
    public ApiResponse<Void> batchSort(@Valid @RequestBody BatchSortRequest request) {
        trainerHighlightService.batchSort(SecurityUtils.getCurrentUserId(), request.getIds());
        return ApiResponse.ok();
    }

    // ==================== C端公开接口 ====================

    @Public
    @Operation(summary = "某专家的已审核精彩瞬间列表")
    @GetMapping("/trainers/{id}/highlights")
    public ApiResponse<List<TrainerHighlightResponse>> listApprovedHighlights(@PathVariable Integer id) {
        return ApiResponse.ok(trainerHighlightService.listApprovedHighlights(id));
    }
}
