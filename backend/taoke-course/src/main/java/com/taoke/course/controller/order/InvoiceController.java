package com.taoke.course.controller.order;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.order.CreateInvoiceRequest;
import com.taoke.course.dto.order.InvoiceRequestVO;
import com.taoke.course.service.order.InvoiceServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 发票申请接口 — 需登录
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
@Tag(name = "发票", description = "订单发票申请")
@RestController
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceServiceImpl invoiceService;

    @Operation(summary = "提交发票申请")
    @PostMapping("/orders/{orderNo}/invoice")
    public ApiResponse<InvoiceRequestVO> submit(
            @PathVariable String orderNo,
            @Valid @RequestBody CreateInvoiceRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(invoiceService.submit(userId, orderNo, request));
    }

    @Operation(summary = "查询订单的发票申请")
    @GetMapping("/orders/{orderNo}/invoice")
    public ApiResponse<InvoiceRequestVO> getByOrderNo(@PathVariable String orderNo) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(invoiceService.getByOrderNo(userId, orderNo));
    }
}
