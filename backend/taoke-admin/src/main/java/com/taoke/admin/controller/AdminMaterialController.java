package com.taoke.admin.controller;



import com.taoke.admin.dto.AdminCreateMaterialRequest;

import com.taoke.admin.dto.AdminMaterialBatchRequest;

import com.taoke.admin.dto.AdminMaterialVO;

import com.taoke.admin.dto.AdminUpdateMaterialRequest;

import com.taoke.admin.service.AdminMaterialService;

import com.taoke.common.dto.PageResult;

import com.taoke.common.enums.BusinessRole;

import com.taoke.common.response.ApiResponse;

import com.taoke.common.security.RequireRole;

import io.swagger.v3.oas.annotations.Operation;

import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;



import java.util.Map;



/**

 * 后台 — 运营素材库

 *

 * @author Fangxinxin

 * @date 2026-06-12 16:00

 */

@Tag(name = "后台-运营素材库")

@RestController

@RequireRole(BusinessRole.Code.SUPER_ADMIN)

@RequiredArgsConstructor

public class AdminMaterialController {



    private final AdminMaterialService adminMaterialService;



    @Operation(summary = "分页查询素材")

    @GetMapping("/admin/materials")

    public ApiResponse<PageResult<AdminMaterialVO>> list(

            @RequestParam(required = false) String materialType,

            @RequestParam(required = false) String keyword,

            @RequestParam(required = false) String category,

            @RequestParam(required = false) String scene,

            @RequestParam(required = false) Boolean enabled,

            @RequestParam(required = false) Boolean isDefault,

            @RequestParam(defaultValue = "1") int page,

            @RequestParam(defaultValue = "20") int size) {

        return ApiResponse.ok(adminMaterialService.list(materialType, keyword, category, scene,

                enabled, isDefault, page, size));

    }



    @Operation(summary = "新增素材")

    @PostMapping("/admin/materials")

    public ApiResponse<AdminMaterialVO> create(@Valid @RequestBody AdminCreateMaterialRequest request) {

        return ApiResponse.ok(adminMaterialService.create(request));

    }



    @Operation(summary = "编辑素材")

    @PutMapping("/admin/materials/{id}")

    public ApiResponse<AdminMaterialVO> update(@PathVariable Integer id,

                                               @Valid @RequestBody AdminUpdateMaterialRequest request) {

        return ApiResponse.ok(adminMaterialService.update(id, request));

    }



    @Operation(summary = "删除素材")

    @DeleteMapping("/admin/materials/{id}")

    public ApiResponse<Void> delete(@PathVariable Integer id) {

        adminMaterialService.delete(id);

        return ApiResponse.ok(null);

    }



    @Operation(summary = "启用/禁用素材")

    @PutMapping("/admin/materials/{id}/enabled")

    public ApiResponse<Void> setEnabled(@PathVariable Integer id,

                                        @RequestBody Map<String, Boolean> body) {

        adminMaterialService.setEnabled(id, Boolean.TRUE.equals(body.get("enabled")));

        return ApiResponse.ok(null);

    }



    @Operation(summary = "设为/取消默认素材")

    @PutMapping("/admin/materials/{id}/default")

    public ApiResponse<Void> setDefault(@PathVariable Integer id,

                                        @RequestBody Map<String, Boolean> body) {

        adminMaterialService.setDefault(id, Boolean.TRUE.equals(body.get("isDefault")));

        return ApiResponse.ok(null);

    }



    @Operation(summary = "批量操作素材")

    @PostMapping("/admin/materials/batch")

    public ApiResponse<Void> batch(@Valid @RequestBody AdminMaterialBatchRequest request) {

        adminMaterialService.batchOperate(request.getIds(), request.getAction());

        return ApiResponse.ok(null);

    }

}

