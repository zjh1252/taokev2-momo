package com.taoke.admin.controller;

import com.taoke.admin.dto.*;
import com.taoke.admin.service.AdminTrainerService;
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
 * 后台 — 专家管理（列表 + 申请审核）。
 *
 * @author Fangxinxin
 * @date 2026-04-02 10:00
 */
@Tag(name = "后台-专家管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminTrainerController {

    private final AdminTrainerService adminTrainerService;

    @Operation(summary = "分页查询专家列表")
    @GetMapping("/admin/trainers")
    public ApiResponse<PageResult<AdminTrainerVO>> list(AdminTrainerQuery query) {
        return ApiResponse.ok(adminTrainerService.listTrainers(query));
    }

    @Operation(summary = "专家详情")
    @GetMapping("/admin/trainers/{id}")
    public ApiResponse<AdminTrainerDetailVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminTrainerService.getTrainerDetail(id));
    }

    @Operation(summary = "分页查询专家申请列表")
    @GetMapping("/admin/trainers/applications")
    public ApiResponse<PageResult<AdminTrainerApplicationVO>> listApplications(AdminTrainerApplicationQuery query) {
        return ApiResponse.ok(adminTrainerService.listApplications(query));
    }

    @Operation(summary = "运营代填专家入驻申请")
    @PostMapping("/admin/trainers/applications")
    public ApiResponse<AdminTrainerApplicationVO> createApplication(
            @Valid @RequestBody AdminCreateTrainerApplicationRequest request) {
        return ApiResponse.ok(adminTrainerService.createTrainerApplication(request));
    }

    @Operation(summary = "审核通过专家申请")
    @PutMapping("/admin/trainers/applications/{userId}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer userId) {
        adminTrainerService.approveApplication(userId);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "驳回专家申请")
    @PutMapping("/admin/trainers/applications/{userId}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer userId,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminTrainerService.rejectApplication(userId, request.getReason());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "专家申请详情（查看入驻/重审时填写的全部资料）")
    @GetMapping("/admin/trainers/applications/{userId}/detail")
    public ApiResponse<AdminApplicationDetailVO> applicationDetail(@PathVariable Integer userId) {
        return ApiResponse.ok(adminTrainerService.getApplicationDetail(userId));
    }

    @Operation(summary = "更新专家档案（运营编辑）")
    @PutMapping("/admin/trainers/{id}")
    public ApiResponse<AdminTrainerDetailVO> update(@PathVariable Integer id,
                                                    @Valid @RequestBody AdminTrainerUpdateRequest request) {
        return ApiResponse.ok(adminTrainerService.updateTrainerDetail(id, request));
    }

    @Operation(summary = "切换专家推荐位（首页/列表页推荐位展示）")
    @PatchMapping("/admin/trainers/{id}/recommend")
    public ApiResponse<Void> setRecommended(@PathVariable Integer id,
                                            @RequestParam Integer value) {
        adminTrainerService.setRecommended(id, value);
        return ApiResponse.ok(null);
    }
}
