package com.taoke.admin.controller;

import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminAllianceLecturer721Service;
import com.taoke.common.dto.PageResult;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequirePermission;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplicationResponse;
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
 * 后台 721 讲师合作申请审核接口。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Tag(name = "后台-721讲师合作")
@RestController
@RequiredArgsConstructor
public class AdminAllianceLecturer721Controller {

    private final AdminAllianceLecturer721Service adminAllianceLecturer721Service;

    @Operation(summary = "分页查询721讲师合作申请")
    @GetMapping("/admin/alliance/lecturers721/applications")
    @RequirePermission("alliance:lecturer721:audit")
    public ApiResponse<PageResult<AllianceLecturer721ApplicationResponse>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(adminAllianceLecturer721Service.page(status, page, size));
    }

    @Operation(summary = "获取721讲师合作申请详情")
    @GetMapping("/admin/alliance/lecturers721/applications/{id}")
    @RequirePermission("alliance:lecturer721:audit")
    public ApiResponse<AllianceLecturer721ApplicationResponse> detail(
            @PathVariable Integer id) {
        return ApiResponse.ok(adminAllianceLecturer721Service.get(id));
    }

    @Operation(summary = "审核通过721讲师合作申请")
    @PutMapping("/admin/alliance/lecturers721/applications/{id}/approve")
    @RequirePermission("alliance:lecturer721:audit")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminAllianceLecturer721Service.approve(id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回721讲师合作申请")
    @PutMapping("/admin/alliance/lecturers721/applications/{id}/reject")
    @RequirePermission("alliance:lecturer721:audit")
    public ApiResponse<Void> reject(
            @PathVariable Integer id,
            @Valid @RequestBody RejectApplicationRequest request) {
        adminAllianceLecturer721Service.reject(id, request.getReason());
        return ApiResponse.ok(null);
    }
}
