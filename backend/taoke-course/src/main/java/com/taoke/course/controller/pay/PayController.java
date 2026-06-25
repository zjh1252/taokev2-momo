package com.taoke.course.controller.pay;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.pay.PayRequest;
import com.taoke.course.dto.pay.PayResultVO;
import com.taoke.course.dto.pay.WechatOpenIdRequest;
import com.taoke.course.dto.pay.WechatOpenIdVO;
import com.taoke.course.service.pay.PayServiceImpl;
import com.taoke.course.service.pay.WechatOpenIdService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 支付接口
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Tag(name = "支付", description = "发起支付、查询支付状态")
@RestController
@RequiredArgsConstructor
public class PayController {

    private final PayServiceImpl payService;
    private final WechatOpenIdService wechatOpenIdService;

    @Operation(summary = "发起支付")
    @PostMapping("/payments")
    public ApiResponse<PayResultVO> pay(@Valid @RequestBody PayRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(payService.pay(userId, request));
    }

    @Operation(summary = "查询支付状态")
    @GetMapping("/payments/{paymentNo}")
    public ApiResponse<PayResultVO> getPaymentStatus(@PathVariable String paymentNo) {
        return ApiResponse.ok(payService.getPaymentStatus(paymentNo));
    }

    @Operation(summary = "微信小程序 code 换 openId")
    @PostMapping("/payments/wechat/openid")
    public ApiResponse<WechatOpenIdVO> resolveWechatOpenId(@Valid @RequestBody WechatOpenIdRequest request) {
        SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(wechatOpenIdService.resolveMiniProgramOpenId(request.getCode()));
    }
}
