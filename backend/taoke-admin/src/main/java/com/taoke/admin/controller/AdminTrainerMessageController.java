package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminTrainerMessageVO;
import com.taoke.admin.service.AdminTrainerMessageService;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequirePermission;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.DemandService;
import com.taoke.course.dto.demand.DemandDetailResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台 — 留言管理。
 *
 * <p>提供留言列表分页查询、详情查看与"标记已处理"操作；不引入分配人字段，
 * 仅做处理状态语义流转（0=新建 / 1=已分配 / 2=已处理）。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
@Tag(name = "后台-留言管理")
@RestController
@RequiredArgsConstructor
public class AdminTrainerMessageController {

    private final AdminTrainerMessageService messageService;
    private final DemandService demandService;

    @Operation(summary = "分页查询留言列表")
    @RequirePermission("trainer-message:manage")
    @GetMapping("/admin/trainer-messages")
    public ApiResponse<PageResponse<AdminTrainerMessageVO>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer trainerUserId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AdminTrainerMessageVO> result = messageService.list(status, trainerUserId, keyword, page, size);
        return ApiResponse.ok(PageResponse.of(result));
    }

    @Operation(summary = "留言详情")
    @RequirePermission("trainer-message:manage")
    @GetMapping("/admin/trainer-messages/{id}")
    public ApiResponse<AdminTrainerMessageVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(messageService.detail(id));
    }

    @Operation(summary = "标记为已处理")
    @RequirePermission("trainer-message:manage")
    @PutMapping("/admin/trainer-messages/{id}/process")
    public ApiResponse<Void> markProcessed(@PathVariable Integer id) {
        messageService.markProcessed(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "转为培训需求")
    @RequirePermission("trainer-message:manage")
    @PostMapping("/admin/trainer-messages/{id}/to-demand")
    public ApiResponse<DemandDetailResponse> convertToDemand(@PathVariable Integer id) {
        return ApiResponse.ok(
                demandService.createFromTrainerMessage(id, SecurityUtils.getRequiredUserId()));
    }
}
