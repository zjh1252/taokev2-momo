package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminVideoSupplierQuery;
import com.taoke.admin.service.AdminVideoSupplierService;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.dto.video.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 后台 — 录播课供应商管理
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Tag(name = "后台-录播课供应商管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminVideoSupplierController {

    private final AdminVideoSupplierService adminVideoSupplierService;

    @Operation(summary = "分页查询供应商")
    @GetMapping("/admin/video-suppliers")
    public ApiResponse<PageResponse<VideoSupplierVO>> list(AdminVideoSupplierQuery query) {
        return ApiResponse.ok(adminVideoSupplierService.list(query));
    }

    @Operation(summary = "供应商详情")
    @GetMapping("/admin/video-suppliers/{id}")
    public ApiResponse<VideoSupplierVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminVideoSupplierService.get(id));
    }

    @Operation(summary = "创建供应商")
    @PostMapping("/admin/video-suppliers")
    public ApiResponse<VideoSupplierVO> create(@Valid @RequestBody SaveVideoSupplierRequest request) {
        return ApiResponse.ok(adminVideoSupplierService.create(request));
    }

    @Operation(summary = "更新供应商")
    @PutMapping("/admin/video-suppliers/{id}")
    public ApiResponse<VideoSupplierVO> update(@PathVariable Integer id,
                                                @Valid @RequestBody SaveVideoSupplierRequest request) {
        return ApiResponse.ok(adminVideoSupplierService.update(id, request));
    }

    @Operation(summary = "删除供应商")
    @DeleteMapping("/admin/video-suppliers/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        adminVideoSupplierService.delete(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "供应商分类树")
    @GetMapping("/admin/video-suppliers/{supplierId}/categories")
    public ApiResponse<List<VideoSupplierCategoryVO>> listCategories(@PathVariable Integer supplierId) {
        return ApiResponse.ok(adminVideoSupplierService.listCategories(supplierId));
    }

    @Operation(summary = "创建供应商分类")
    @PostMapping("/admin/video-suppliers/{supplierId}/categories")
    public ApiResponse<VideoSupplierCategoryVO> createCategory(
            @PathVariable Integer supplierId,
            @Valid @RequestBody SaveVideoSupplierCategoryRequest request) {
        return ApiResponse.ok(adminVideoSupplierService.createCategory(supplierId, request));
    }

    @Operation(summary = "更新供应商分类")
    @PutMapping("/admin/video-suppliers/{supplierId}/categories/{categoryId}")
    public ApiResponse<VideoSupplierCategoryVO> updateCategory(
            @PathVariable Integer supplierId,
            @PathVariable Integer categoryId,
            @Valid @RequestBody SaveVideoSupplierCategoryRequest request) {
        return ApiResponse.ok(adminVideoSupplierService.updateCategory(supplierId, categoryId, request));
    }

    @Operation(summary = "删除供应商分类")
    @DeleteMapping("/admin/video-suppliers/{supplierId}/categories/{categoryId}")
    public ApiResponse<Void> deleteCategory(@PathVariable Integer supplierId,
                                             @PathVariable Integer categoryId) {
        adminVideoSupplierService.deleteCategory(supplierId, categoryId);
        return ApiResponse.ok();
    }

    @Operation(summary = "分类下录播课列表")
    @GetMapping("/admin/video-suppliers/{supplierId}/categories/{categoryId}/videos")
    public ApiResponse<List<VideoListItemVO>> listCategoryVideos(
            @PathVariable Integer supplierId,
            @PathVariable Integer categoryId) {
        return ApiResponse.ok(adminVideoSupplierService.listCategoryVideos(supplierId, categoryId));
    }

    @Operation(summary = "分配录播课到分类")
    @PutMapping("/admin/video-suppliers/{supplierId}/categories/{categoryId}/videos")
    public ApiResponse<Void> assignCategoryVideos(
            @PathVariable Integer supplierId,
            @PathVariable Integer categoryId,
            @Valid @RequestBody SaveSupplierCategoryVideoRequest request) {
        adminVideoSupplierService.assignCategoryVideos(supplierId, categoryId, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "从分类移除录播课")
    @DeleteMapping("/admin/video-suppliers/{supplierId}/categories/{categoryId}/videos/{videoId}")
    public ApiResponse<Void> removeCategoryVideo(@PathVariable Integer supplierId,
                                                  @PathVariable Integer categoryId,
                                                  @PathVariable Integer videoId) {
        adminVideoSupplierService.removeCategoryVideo(supplierId, categoryId, videoId);
        return ApiResponse.ok();
    }
}
