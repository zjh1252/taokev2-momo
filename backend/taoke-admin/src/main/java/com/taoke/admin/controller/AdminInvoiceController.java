package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminInvoiceQuery;
import com.taoke.admin.dto.BatchIdsRequest;
import com.taoke.admin.dto.BatchRejectRequest;
import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.service.AdminInvoiceService;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.dto.order.AdminInvoiceListItemVO;
import com.taoke.course.dto.order.AdminInvoiceStatsVO;
import com.taoke.course.dto.order.MarkInvoiceIssuedRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 发票申请管理
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Tag(name = "后台-发票申请管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminInvoiceController {

    private final AdminInvoiceService adminInvoiceService;

    @Operation(summary = "分页查询发票申请")
    @GetMapping("/admin/invoices")
    public ApiResponse<PageResponse<AdminInvoiceListItemVO>> list(AdminInvoiceQuery query) {
        return ApiResponse.ok(adminInvoiceService.list(query));
    }

    @Operation(summary = "审核通过（进入开具中）")
    @PutMapping("/admin/invoices/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminInvoiceService.approve(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "驳回发票申请")
    @PutMapping("/admin/invoices/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminInvoiceService.reject(id, request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "标记已开具")
    @PutMapping("/admin/invoices/{id}/issue")
    public ApiResponse<Void> markIssued(@PathVariable Integer id,
                                        @RequestBody(required = false) MarkInvoiceIssuedRequest request) {
        adminInvoiceService.markIssued(id, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "批量审核通过")
    @PutMapping("/admin/invoices/batch/approve")
    public ApiResponse<Void> batchApprove(@Valid @RequestBody BatchIdsRequest request) {
        adminInvoiceService.batchApprove(request);
        return ApiResponse.ok();
    }

    @Operation(summary = "批量驳回")
    @PutMapping("/admin/invoices/batch/reject")
    public ApiResponse<Void> batchReject(@Valid @RequestBody BatchRejectRequest request) {
        adminInvoiceService.batchReject(request, request.getReason());
        return ApiResponse.ok();
    }

    @Operation(summary = "批量删除发票申请")
    @DeleteMapping("/admin/invoices/batch")
    public ApiResponse<Void> batchDelete(@Valid @RequestBody BatchIdsRequest request) {
        adminInvoiceService.batchDelete(request);
        return ApiResponse.ok();
    }

    @Operation(summary = "发票状态统计")
    @GetMapping("/admin/invoices/stats")
    public ApiResponse<AdminInvoiceStatsVO> stats() {
        return ApiResponse.ok(adminInvoiceService.stats());
    }
}
