package com.taoke.admin.controller;

import com.taoke.admin.dto.PermissionVO;
import com.taoke.admin.dto.SavePermissionRequest;
import com.taoke.admin.service.AdminPermissionService;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 后台 — 权限管理。
 */
@Tag(name = "后台-权限管理")
@RestController
@RequestMapping("/admin/permissions")
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminPermissionController {

    private final AdminPermissionService adminPermissionService;

    @Operation(summary = "获取权限树")
    @GetMapping("/tree")
    public ApiResponse<List<PermissionVO>> tree() {
        return ApiResponse.ok(adminPermissionService.getPermissionTree());
    }

    @Operation(summary = "获取权限列表（平铺）")
    @GetMapping
    public ApiResponse<List<PermissionVO>> list() {
        return ApiResponse.ok(adminPermissionService.listAll());
    }

    @Operation(summary = "新增权限")
    @PostMapping
    public ApiResponse<PermissionVO> create(@Valid @RequestBody SavePermissionRequest request) {
        return ApiResponse.ok(adminPermissionService.create(request));
    }

    @Operation(summary = "编辑权限")
    @PutMapping("/{id}")
    public ApiResponse<PermissionVO> update(@PathVariable Integer id,
                                            @Valid @RequestBody SavePermissionRequest request) {
        return ApiResponse.ok(adminPermissionService.update(id, request));
    }

    @Operation(summary = "删除权限")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        adminPermissionService.delete(id);
        return ApiResponse.ok();
    }
}
