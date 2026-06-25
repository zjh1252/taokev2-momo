package com.taoke.course.controller.pay;

import com.taoke.course.service.pay.PaymentNotifyService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 第三方支付异步回调（公网白名单，无需 JWT）。
 *
 * @author Fangxinxin
 * @date 2026-06-25 10:00
 */
@Hidden
@RestController
@RequiredArgsConstructor
public class PaymentNotifyController {

    private final PaymentNotifyService paymentNotifyService;

    @PostMapping(value = "/payments/alipay/notify", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String alipayNotify(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return paymentNotifyService.handleAlipayNotify(params);
    }

    @PostMapping(value = "/payments/wechat/notify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public String wechatNotify(
            @RequestBody String body,
            HttpServletRequest request) {
        return paymentNotifyService.handleWechatNotify(
                body,
                request.getHeader("Wechatpay-Serial"),
                request.getHeader("Wechatpay-Signature"),
                request.getHeader("Wechatpay-Timestamp"),
                request.getHeader("Wechatpay-Nonce"));
    }
}
