package com.taoke.admin.controller;

import com.taoke.admin.dto.AssignPermissionsRequest;
import com.taoke.admin.dto.RoleVO;
import com.taoke.admin.dto.SaveRoleRequest;
import com.taoke.admin.service.AdminRoleService;
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
 * 后台 — 角色管理。
 */
@Tag(name = "后台-角色管理")
@RestController
@RequestMapping("/admin/roles")
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    @Operation(summary = "获取角色列表（可选按 type 过滤：BUSINESS / PLATFORM）")
    @GetMapping
    public ApiResponse<List<RoleVO>> list(@RequestParam(required = false) String type) {
        return ApiResponse.ok(adminRoleService.listAll(type));
    }

    @Operation(summary = "获取角色详情（含权限 ID）")
    @GetMapping("/{id}")
    public ApiResponse<RoleVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminRoleService.getById(id));
    }

    @Operation(summary = "新增角色")
    @PostMapping
    public ApiResponse<RoleVO> create(@Valid @RequestBody SaveRoleRequest request) {
        return ApiResponse.ok(adminRoleService.create(request));
    }

    @Operation(summary = "编辑角色")
    @PutMapping("/{id}")
    public ApiResponse<RoleVO> update(@PathVariable Integer id,
                                      @Valid @RequestBody SaveRoleRequest request) {
        return ApiResponse.ok(adminRoleService.update(id, request));
    }

    @Operation(summary = "删除角色")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        adminRoleService.delete(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "分配权限（全量替换）")
    @PutMapping("/{id}/permissions")
    public ApiResponse<Void> assignPermissions(@PathVariable Integer id,
                                               @Valid @RequestBody AssignPermissionsRequest request) {
        adminRoleService.assignPermissions(id, request);
        return ApiResponse.ok();
    }
}
