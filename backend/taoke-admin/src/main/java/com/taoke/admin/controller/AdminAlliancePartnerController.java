package com.taoke.admin.controller;

import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminAlliancePartnerService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequirePermission;
import com.taoke.user.dto.alliance.AlliancePartnerApplicationResponse;
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
 * 后台培训合伙人申请审核接口。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:25
 */
@Tag(name = "后台-培训合伙人")
@RestController
@RequiredArgsConstructor
public class AdminAlliancePartnerController {

    private final AdminAlliancePartnerService adminAlliancePartnerService;

    @Operation(summary = "分页查询培训合伙人申请")
    @GetMapping("/admin/alliance/partners/applications")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<PageResult<AlliancePartnerApplicationResponse>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(adminAlliancePartnerService.page(status, page, size));
    }

    @Operation(summary = "获取培训合伙人申请详情")
    @GetMapping("/admin/alliance/partners/applications/{id}")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<AlliancePartnerApplicationResponse> detail(
            @PathVariable Integer id) {
        return ApiResponse.ok(adminAlliancePartnerService.get(id));
    }

    @Operation(summary = "审核通过培训合伙人申请")
    @PutMapping("/admin/alliance/partners/applications/{id}/approve")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminAlliancePartnerService.approve(id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回培训合伙人申请")
    @PutMapping("/admin/alliance/partners/applications/{id}/reject")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<Void> reject(
            @PathVariable Integer id,
            @Valid @RequestBody RejectApplicationRequest request) {
        adminAlliancePartnerService.reject(id, request.getReason());
        return ApiResponse.ok(null);
    }
}
