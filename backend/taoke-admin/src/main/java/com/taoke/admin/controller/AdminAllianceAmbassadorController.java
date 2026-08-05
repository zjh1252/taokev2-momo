package com.taoke.admin.controller;

import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminAllianceAmbassadorService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequirePermission;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplicationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台推广大使申请审核接口。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Tag(name = "后台-推广大使")
@RestController
@RequiredArgsConstructor
public class AdminAllianceAmbassadorController {

    private final AdminAllianceAmbassadorService adminAllianceAmbassadorService;

    @Operation(summary = "分页查询推广大使申请")
    @GetMapping("/admin/alliance/ambassadors/applications")
    @RequirePermission("alliance:ambassador:audit")
    public ApiResponse<PageResult<AllianceAmbassadorApplicationResponse>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(adminAllianceAmbassadorService.page(status, page, size));
    }

    @Operation(summary = "获取推广大使申请详情")
    @GetMapping("/admin/alliance/ambassadors/applications/{id}")
    @RequirePermission("alliance:ambassador:audit")
    public ApiResponse<AllianceAmbassadorApplicationResponse> detail(
            @PathVariable Integer id) {
        return ApiResponse.ok(adminAllianceAmbassadorService.get(id));
    }

    @Operation(summary = "审核通过推广大使申请")
    @PutMapping("/admin/alliance/ambassadors/applications/{id}/approve")
    @RequirePermission("alliance:ambassador:audit")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminAllianceAmbassadorService.approve(id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回推广大使申请")
    @PutMapping("/admin/alliance/ambassadors/applications/{id}/reject")
    @RequirePermission("alliance:ambassador:audit")
    public ApiResponse<Void> reject(
            @PathVariable Integer id,
            @Valid @RequestBody RejectApplicationRequest request) {
        adminAllianceAmbassadorService.reject(id, request.getReason());
        return ApiResponse.ok(null);
    }
}
