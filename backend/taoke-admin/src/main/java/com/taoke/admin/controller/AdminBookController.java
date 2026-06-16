package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminBookVO;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminBookService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import com.taoke.user.dto.trainerbook.TrainerBookResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 著作管理
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:30
 */
@Tag(name = "后台-著作管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminBookController {

    private final AdminBookService adminBookService;

    @Operation(summary = "分页查询著作列表")
    @GetMapping("/admin/books")
    public ApiResponse<PageResult<AdminBookVO>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminBookService.list(status, keyword, page, size));
    }

    @Operation(summary = "著作详情")
    @GetMapping("/admin/books/{id}")
    public ApiResponse<AdminBookVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminBookService.getDetail(id));
    }

    @Operation(summary = "运营添加著作")
    @PostMapping("/admin/books")
    public ApiResponse<TrainerBookResponse> create(@RequestParam Integer trainerId,
                                                   @Valid @RequestBody SaveTrainerBookRequest request) {
        Integer operatorId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(adminBookService.create(trainerId, operatorId, request));
    }

    @Operation(summary = "审核通过")
    @PutMapping("/admin/books/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminBookService.approve(id, SecurityUtils.getCurrentUserId());
        return ApiResponse.ok();
    }

    @Operation(summary = "审核驳回")
    @PutMapping("/admin/books/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminBookService.reject(id, SecurityUtils.getCurrentUserId(), request.getReason());
        return ApiResponse.ok();
    }
}
