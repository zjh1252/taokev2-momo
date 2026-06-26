package com.taoke.admin.controller;

import com.taoke.admin.dto.AdminVideoOrderQuery;
import com.taoke.admin.dto.BatchIdsRequest;
import com.taoke.admin.service.AdminVideoOrderService;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.dto.order.AdminVideoOrderListItemVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 录播课订单管理
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Tag(name = "后台-录播课订单管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminVideoOrderController {

    private final AdminVideoOrderService adminVideoOrderService;

    @Operation(summary = "分页查询录播课订单")
    @GetMapping("/admin/video-orders")
    public ApiResponse<PageResponse<AdminVideoOrderListItemVO>> list(AdminVideoOrderQuery query) {
        return ApiResponse.ok(adminVideoOrderService.list(query));
    }

    @Operation(summary = "录播课订单详情")
    @GetMapping("/admin/video-orders/{id}")
    public ApiResponse<AdminVideoOrderListItemVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminVideoOrderService.getDetail(id));
    }

    @Operation(summary = "刷新订单支付状态")
    @PostMapping("/admin/video-orders/{orderNo}/refresh")
    public ApiResponse<AdminVideoOrderListItemVO> refresh(@PathVariable String orderNo) {
        return ApiResponse.ok(adminVideoOrderService.refreshOrderStatus(orderNo));
    }

    @Operation(summary = "批量删除订单")
    @DeleteMapping("/admin/video-orders/batch")
    public ApiResponse<Void> batchDelete(@Valid @RequestBody BatchIdsRequest request) {
        adminVideoOrderService.batchDelete(request);
        return ApiResponse.ok();
    }
}
