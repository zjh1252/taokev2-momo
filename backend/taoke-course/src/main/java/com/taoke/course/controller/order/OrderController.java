package com.taoke.course.controller.order;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.order.CreateOrderRequest;
import com.taoke.course.dto.order.OrderVO;
import com.taoke.course.service.order.OrderServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 订单接口 — 需登录
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Tag(name = "订单", description = "订单创建、查询、取消")
@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderServiceImpl orderService;

    @Operation(summary = "创建订单")
    @PostMapping("/orders")
    public ApiResponse<OrderVO> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(orderService.createOrder(userId, request));
    }

    @Operation(summary = "我的订单列表")
    @GetMapping("/orders")
    public ApiResponse<PageResponse<OrderVO>> listOrders(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(orderService.listOrders(userId, status, page, size));
    }

    @Operation(summary = "订单详情")
    @GetMapping("/orders/{orderNo}")
    public ApiResponse<OrderVO> getOrderDetail(@PathVariable String orderNo) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(orderService.getOrderDetail(userId, orderNo));
    }

    @Operation(summary = "取消订单")
    @PutMapping("/orders/{orderNo}/cancel")
    public ApiResponse<Void> cancelOrder(@PathVariable String orderNo) {
        Integer userId = SecurityUtils.getRequiredUserId();
        orderService.cancelOrder(userId, orderNo);
        return ApiResponse.ok();
    }

    @Operation(summary = "查询指定商品的有效待支付订单（购买前提醒）")
    @GetMapping("/orders/pending-by-product")
    public ApiResponse<OrderVO> findPendingByProduct(
            @RequestParam String productType,
            @RequestParam Integer productId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(orderService.findPendingOrderByProduct(userId, productType, productId));
    }
}
