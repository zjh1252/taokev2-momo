package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminUserQuery;
import com.taoke.admin.dto.AdminUserVO;
import com.taoke.admin.dto.UpdateUserStatusRequest;
import com.taoke.admin.service.AdminUserService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 用户管理。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Tag(name = "后台-用户管理")
@RestController
@RequestMapping("/admin/users")
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @Operation(summary = "分页查询用户列表")
    @GetMapping
    public ApiResponse<PageResult<AdminUserVO>> list(AdminUserQuery query) {
        return ApiResponse.ok(adminUserService.listUsers(query));
    }

    @Operation(summary = "变更用户状态（冻结/解冻）")
    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Integer id,
                                          @Valid @RequestBody UpdateUserStatusRequest request) {
        adminUserService.updateStatus(id, request);
        return ApiResponse.ok(null);
    }
}
