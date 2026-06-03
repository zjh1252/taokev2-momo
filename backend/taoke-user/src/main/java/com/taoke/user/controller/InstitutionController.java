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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
    @Operation(summary = "机构公开列表（分页 + 多筛选）")
    @GetMapping("/institutions")
    public ApiResponse<PageResponse<InstitutionListItemResponse>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "default") String sort,
            @RequestParam(required = false) Boolean association,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) Integer cityId,
            @RequestParam(required = false) java.math.BigDecimal minScore) {
        return ApiResponse.ok(institutionService.listPublic(page, size, keyword, sort, association,
                specialty, industry, provinceId, cityId, minScore));
    }

    @Public
    @Operation(summary = "机构筛选项聚合（擅长领域/擅长行业 计数）")
    @GetMapping("/institutions/facets")
    public ApiResponse<com.taoke.user.dto.institution.InstitutionFacetsResponse> facets() {
        return ApiResponse.ok(institutionService.listFacets());
    }

    @Public
    @Operation(summary = "高分培训机构")
    @GetMapping("/institutions/top-rated")
    public ApiResponse<java.util.List<InstitutionListItemResponse>> topRated(
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.ok(institutionService.listTopRated(limit));
    }

    @Public
    @Operation(summary = "最新加入培训机构")
    @GetMapping("/institutions/newest")
    public ApiResponse<java.util.List<InstitutionListItemResponse>> newest(
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.ok(institutionService.listNewest(limit));
    }

    @Public
    @Operation(summary = "金牌推荐培训机构")
    @GetMapping("/institutions/recommended")
    public ApiResponse<java.util.List<InstitutionListItemResponse>> recommended(
            @RequestParam(defaultValue = "4") int limit) {
        return ApiResponse.ok(institutionService.listRecommended(limit));
    }

    @Public
    @Operation(summary = "机构公开详情页")
    @GetMapping("/institutions/{id}")
    public ApiResponse<InstitutionPublicResponse> getPublicProfile(@PathVariable Integer id) {
        return ApiResponse.ok(institutionService.getPublicProfile(id));
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
