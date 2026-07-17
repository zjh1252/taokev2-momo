package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.trainer.*;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.api.TrainerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 专家自服务接口 — 档案管理、入驻申请、子表 CRUD、公开详情。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Tag(name = "专家", description = "TRAINER 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class TrainerController {

    private final TrainerService trainerService;

    // ==================== 主表操作 ====================

    @Operation(summary = "获取本人专家档案（含子表数据和报价）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @GetMapping("/trainers/me")
    public ApiResponse<TrainerResponse> get() {
        return ApiResponse.ok(trainerService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存专家档案（有则更新、无则创建）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @PutMapping("/trainers/me")
    public ApiResponse<TrainerResponse> save(@Valid @RequestBody TrainerRequest request) {
        return ApiResponse.ok(trainerService.save(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "申请成为专家")
    @PostMapping("/trainers/apply")
    public ApiResponse<Void> apply(@Valid @RequestBody TrainerRequest request) {
        trainerService.apply(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "查看专家入驻申请状态")
    @GetMapping("/trainers/apply/status")
    public ApiResponse<RoleApplicationStatusResponse> getApplyStatus() {
        return ApiResponse.ok(trainerService.getApplyStatus(SecurityUtils.getRequiredUserId()));
    }

    // ==================== 公开接口 ====================

    @Public
    @Operation(summary = "专家公开列表（分页 + 筛选）")
    @GetMapping("/trainers")
    public ApiResponse<PageResponse<TrainerListItemResponse>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) Integer expertiseCategoryId,
            @RequestParam(required = false) Integer industryCategoryId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) Integer cityId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "default") String sort,
            @RequestParam(required = false) Integer isTrusted) {
        return ApiResponse.ok(trainerService.listPublic(page, size,
                expertiseCategoryId, industryCategoryId, provinceId, cityId, keyword, sort, isTrusted));
    }

    @Public
    @Operation(summary = "专家擅长领域一级分类批量计数（底部分类导航）")
    @GetMapping("/trainers/expertise-category-counts")
    public ApiResponse<java.util.Map<Integer, Long>> expertiseCategoryCounts() {
        return ApiResponse.ok(trainerService.countPublicByExpertiseL1());
    }

    @Public
    @Operation(summary = "C 端首页/列表页推荐专家位（最多 limit 条；不足时按 id 倒序补齐，允许重复）")
    @GetMapping("/trainers/recommended")
    public ApiResponse<List<TrainerListItemResponse>> recommendedForTop(
            @RequestParam(defaultValue = "12") int limit) {
        return ApiResponse.ok(trainerService.listRecommendedForTop(limit));
    }

    @Public
    @Operation(summary = "专家公开详情页（不含报价信息）；bumpView=1 时仅曝光 +1")
    @GetMapping("/trainers/{id}")
    public ApiResponse<?> getPublicProfile(
            @PathVariable Integer id,
            @RequestParam(required = false) Boolean bumpView) {
        if (Boolean.TRUE.equals(bumpView)) {
            trainerService.incrementViewCount(id);
            return ApiResponse.ok(null);
        }
        return ApiResponse.ok(trainerService.getPublicProfile(id));
    }

    @Public
    @Operation(summary = "专家列表点击曝光 +1（兼容旧客户端）")
    @PostMapping("/trainers/{id}/view")
    public ApiResponse<Void> incrementViewCount(@PathVariable Integer id) {
        trainerService.incrementViewCount(id);
        return ApiResponse.ok(null);
    }

    @Public
    @Operation(summary = "专家详情页推荐相关专家（最多 3 条）")
    @GetMapping("/trainers/{id}/recommended-trainers")
    public ApiResponse<List<TrainerListItemResponse>> recommendedTrainers(@PathVariable Integer id) {
        return ApiResponse.ok(trainerService.listRecommendedTrainers(id));
    }

    // ==================== 教育经历 ====================

    @Operation(summary = "获取本人教育经历列表")
    @RequireRole(BusinessRole.Code.TRAINER)
    @GetMapping("/trainers/me/educations")
    public ApiResponse<List<TrainerEducationDTO>> getEducations() {
        TrainerResponse resp = trainerService.getByUserId(SecurityUtils.getRequiredUserId());
        return ApiResponse.ok(resp != null ? resp.getEducations() : List.of());
    }

    @Operation(summary = "整体保存本人教育经历（全量替换）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @PutMapping("/trainers/me/educations")
    public ApiResponse<List<TrainerEducationDTO>> saveEducations(
            @Valid @RequestBody List<TrainerEducationDTO> educations) {
        return ApiResponse.ok(trainerService.saveEducations(SecurityUtils.getRequiredUserId(), educations));
    }

    // ==================== 工作经历 ====================

    @Operation(summary = "获取本人工作经历列表")
    @RequireRole(BusinessRole.Code.TRAINER)
    @GetMapping("/trainers/me/work-experiences")
    public ApiResponse<List<TrainerWorkExperienceDTO>> getWorkExperiences() {
        TrainerResponse resp = trainerService.getByUserId(SecurityUtils.getRequiredUserId());
        return ApiResponse.ok(resp != null ? resp.getWorkExperiences() : List.of());
    }

    @Operation(summary = "整体保存本人工作经历（全量替换）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @PutMapping("/trainers/me/work-experiences")
    public ApiResponse<List<TrainerWorkExperienceDTO>> saveWorkExperiences(
            @Valid @RequestBody List<TrainerWorkExperienceDTO> workExperiences) {
        return ApiResponse.ok(trainerService.saveWorkExperiences(SecurityUtils.getRequiredUserId(), workExperiences));
    }

    // ==================== 荣誉资质 ====================

    @Operation(summary = "获取本人荣誉资质列表")
    @RequireRole(BusinessRole.Code.TRAINER)
    @GetMapping("/trainers/me/honors")
    public ApiResponse<List<TrainerHonorDTO>> getHonors() {
        TrainerResponse resp = trainerService.getByUserId(SecurityUtils.getRequiredUserId());
        return ApiResponse.ok(resp != null ? resp.getHonors() : List.of());
    }

    @Operation(summary = "整体保存本人荣誉资质（全量替换）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @PutMapping("/trainers/me/honors")
    public ApiResponse<List<TrainerHonorDTO>> saveHonors(
            @Valid @RequestBody List<TrainerHonorDTO> honors) {
        return ApiResponse.ok(trainerService.saveHonors(SecurityUtils.getRequiredUserId(), honors));
    }

    // ==================== 培训领域分类 ====================

    @Operation(summary = "获取本人培训领域分类列表")
    @RequireRole(BusinessRole.Code.TRAINER)
    @GetMapping("/trainers/me/expertise-categories")
    public ApiResponse<List<CategoryRefDTO>> getExpertiseCategories() {
        TrainerResponse resp = trainerService.getByUserId(SecurityUtils.getRequiredUserId());
        return ApiResponse.ok(resp != null ? resp.getExpertiseCategories() : List.of());
    }

    @Operation(summary = "整体保存本人培训领域分类（全量替换）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @PutMapping("/trainers/me/expertise-categories")
    public ApiResponse<List<CategoryRefDTO>> saveExpertiseCategories(
            @Valid @RequestBody List<CategoryRefDTO> categories) {
        return ApiResponse.ok(trainerService.saveExpertiseCategories(SecurityUtils.getRequiredUserId(), categories));
    }

    // ==================== 擅长行业分类 ====================

    @Operation(summary = "获取本人擅长行业分类列表")
    @RequireRole(BusinessRole.Code.TRAINER)
    @GetMapping("/trainers/me/industry-categories")
    public ApiResponse<List<CategoryRefDTO>> getIndustryCategories() {
        TrainerResponse resp = trainerService.getByUserId(SecurityUtils.getRequiredUserId());
        return ApiResponse.ok(resp != null ? resp.getIndustryCategories() : List.of());
    }

    @Operation(summary = "整体保存本人擅长行业分类（全量替换）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @PutMapping("/trainers/me/industry-categories")
    public ApiResponse<List<CategoryRefDTO>> saveIndustryCategories(
            @Valid @RequestBody List<CategoryRefDTO> categories) {
        return ApiResponse.ok(trainerService.saveIndustryCategories(SecurityUtils.getRequiredUserId(), categories));
    }
}
