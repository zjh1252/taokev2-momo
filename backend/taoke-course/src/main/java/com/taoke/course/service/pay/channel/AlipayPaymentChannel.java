package com.taoke.course.service.pay.channel;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.alipay.api.request.AlipayTradeWapPayRequest;
import com.alipay.api.response.AlipayTradePagePayResponse;
import com.alipay.api.response.AlipayTradeWapPayResponse;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.config.PaymentProperties;
import com.taoke.course.dto.pay.PaymentPrepayResult;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.pay.Payment;
import com.taoke.course.enums.PaymentClientType;
import com.taoke.course.enums.PaymentMethod;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 支付宝支付：PC 网站支付 + 手机网站支付（H5/App 跳转）。
 *
 * @author Fangxinxin
 * @date 2026-06-25 14:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlipayPaymentChannel implements PaymentChannel {

    private final PaymentProperties paymentProperties;

    @Override
    public PaymentMethod method() {
        return PaymentMethod.ALIPAY;
    }

    @Override
    public boolean isConfigured() {
        return paymentProperties.isAlipayConfigured();
    }

    @Override
    public PaymentPrepayResult prepay(
            Payment payment,
            Order order,
            String subject,
            PaymentClientType clientType,
            String openId) {
        return clientType == PaymentClientType.PC
                ? prepayPc(payment, order, subject)
                : prepayWap(payment, order, subject);
    }

    private PaymentPrepayResult prepayPc(Payment payment, Order order, String subject) {
        PaymentProperties.Alipay cfg = paymentProperties.getAlipay();
        try {
            AlipayClient client = buildClient(cfg);
            AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
            request.setNotifyUrl(paymentProperties.alipayNotifyUrl());
            request.setReturnUrl(paymentProperties.alipayReturnUrl() + "?orderNo=" + order.getOrderNo());
            request.setBizContent(buildBizContent(payment, subject, "FAST_INSTANT_TRADE_PAY"));

            AlipayTradePagePayResponse response = client.pageExecute(request, "GET");
            if (!response.isSuccess()) {
                log.warn("支付宝 PC 预下单失败: paymentNo={}, subCode={}, subMsg={}",
                        payment.getPaymentNo(), response.getSubCode(), response.getSubMsg());
                throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
            }

            PaymentPrepayResult result = new PaymentPrepayResult();
            result.setPayUrl(response.getBody());
            return result;
        } catch (AlipayApiException e) {
            log.error("支付宝 PC 预下单异常: paymentNo={}", payment.getPaymentNo(), e);
            throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
        }
    }

    private PaymentPrepayResult prepayWap(Payment payment, Order order, String subject) {
        PaymentProperties.Alipay cfg = paymentProperties.getAlipay();
        try {
            AlipayClient client = buildClient(cfg);
            AlipayTradeWapPayRequest request = new AlipayTradeWapPayRequest();
            request.setNotifyUrl(paymentProperties.alipayNotifyUrl());
            request.setReturnUrl(paymentProperties.alipayMobileReturnUrl(order.getOrderNo()));
            request.setBizContent(buildBizContent(payment, subject, "QUICK_WAP_WAY"));

            AlipayTradeWapPayResponse response = client.pageExecute(request, "GET");
            if (!response.isSuccess()) {
                log.warn("支付宝 WAP 预下单失败: paymentNo={}, subCode={}, subMsg={}",
                        payment.getPaymentNo(), response.getSubCode(), response.getSubMsg());
                throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
            }

            PaymentPrepayResult result = new PaymentPrepayResult();
            result.setPayUrl(response.getBody());
            return result;
        } catch (AlipayApiException e) {
            log.error("支付宝 WAP 预下单异常: paymentNo={}", payment.getPaymentNo(), e);
            throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
        }
    }

    private AlipayClient buildClient(PaymentProperties.Alipay cfg) {
        return new DefaultAlipayClient(
                cfg.getGatewayUrl(),
                cfg.getAppId(),
                cfg.getPrivateKey(),
                "json",
                "UTF-8",
                cfg.getAlipayPublicKey(),
                "RSA2");
    }

    private String buildBizContent(Payment payment, String subject, String productCode) {
        return """
                {
                  "out_trade_no":"%s",
                  "product_code":"%s",
                  "total_amount":"%s",
                  "subject":"%s"
                }
                """.formatted(
                payment.getPaymentNo(),
                productCode,
                payment.getAmount().toPlainString(),
                escapeJson(subject));
    }

    private static String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
