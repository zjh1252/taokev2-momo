package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.institution.InstitutionPublicResponse;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerHighlightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

/**
 * 机构接口 — 公开列表/详情 + INSTITUTION 角色扩展信息自服务。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Tag(name = "机构", description = "机构公开展示与 INSTITUTION 角色信息管理")
@RestController
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;
    private final TrainerHighlightService trainerHighlightService;
    private final TrainerCaseService trainerCaseService;

    // ==================== 公开接口 ====================

    @Public
    @Operation(summary = "机构公开下拉/搜索（按 keyword 模糊匹配机构名）")
    @GetMapping("/institutions/lookup")
    public ApiResponse<java.util.List<java.util.Map<String, Object>>> lookup(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(institutionService.lookup(keyword, size));
    }

    @Public
    @Operation(summary = "机构公开列表（分页 + 搜索）")
    @GetMapping("/institutions")
    public ApiResponse<PageResponse<InstitutionListItemResponse>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "default") String sort,
            @RequestParam(required = false) Boolean association,
            @RequestParam(required = false) Integer expertiseCategoryId,
            @RequestParam(required = false) Integer cityId) {
        return ApiResponse.ok(institutionService.listPublic(
                page, size, keyword, sort, association, expertiseCategoryId, cityId));
    }

    @Public
    @Operation(summary = "机构擅长领域一级分类批量计数（侧栏分类导航）")
    @GetMapping("/institutions/expertise-category-counts")
    public ApiResponse<Map<Integer, Long>> expertiseCategoryCounts(
            @RequestParam(required = false) Boolean association) {
        return ApiResponse.ok(institutionService.countPublicByExpertiseL1(association));
    }

    @Public
    @Operation(summary = "机构频道侧栏推荐（高分/周活跃/新入驻）")
    @GetMapping("/institutions/recommendations")
    public ApiResponse<List<InstitutionListItemResponse>> listRecommendations(
            @RequestParam String type,
            @RequestParam(required = false) Boolean association,
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.ok(institutionService.listRecommended(type, association, limit));
    }

    @Public
    @Operation(summary = "机构公开详情页；bumpView=1 时仅人气 +1")
    @GetMapping("/institutions/{id}")
    public ApiResponse<?> getPublicProfile(
            @PathVariable Integer id,
            @RequestParam(required = false) Boolean bumpView) {
        if (Boolean.TRUE.equals(bumpView)) {
            institutionService.incrementViewCount(id);
            return ApiResponse.ok(null);
        }
        return ApiResponse.ok(institutionService.getPublicProfile(id));
    }

    @Public
    @Operation(summary = "机构列表点击人气 +1（兼容旧客户端）")
    @PostMapping("/institutions/{id}/view")
    public ApiResponse<Void> incrementViewCount(@PathVariable Integer id) {
        institutionService.incrementViewCount(id);
        return ApiResponse.ok(null);
    }

    @Public
    @Operation(summary = "机构详情页：精彩瞬间（机构主体 + 挂靠专家）")
    @GetMapping("/institutions/{id}/highlights")
    public ApiResponse<List<com.taoke.user.dto.trainerhighlight.TrainerHighlightResponse>> listHighlights(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "12") int limit) {
        return ApiResponse.ok(trainerHighlightService.listApprovedHighlightsForInstitution(id, limit));
    }

    @Public
    @Operation(summary = "机构详情页：挂靠专家授课案例")
    @GetMapping("/institutions/{id}/cases")
    public ApiResponse<List<com.taoke.user.dto.trainercase.TrainerCaseResponse>> listCases(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "12") int limit) {
        return ApiResponse.ok(trainerCaseService.listApprovedCasesForInstitution(id, limit));
    }

    // ==================== 自服务接口 ====================

    @Operation(summary = "获取机构信息")
    @RequireRole(BusinessRole.Code.INSTITUTION)
    @GetMapping("/institutions/me")
    public ApiResponse<InstitutionResponse> get() {
        return ApiResponse.ok(institutionService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存机构信息（有则更新、无则创建）")
    @RequireRole(BusinessRole.Code.INSTITUTION)
    @PutMapping("/institutions/me")
    public ApiResponse<InstitutionResponse> save(@Valid @RequestBody InstitutionRequest request) {
        return ApiResponse.ok(institutionService.save(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "申请成为机构")
    @PostMapping("/institutions/apply")
    public ApiResponse<Void> apply(@Valid @RequestBody InstitutionRequest request) {
        institutionService.apply(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "查看机构入驻申请状态")
    @GetMapping("/institutions/apply/status")
    public ApiResponse<RoleApplicationStatusResponse> getApplyStatus() {
        return ApiResponse.ok(institutionService.getApplyStatus(SecurityUtils.getRequiredUserId()));
    }
}
