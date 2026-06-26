package com.taoke.course.service.pay;

import com.alipay.api.internal.util.AlipaySignature;
import com.taoke.course.config.PaymentProperties;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.pay.Payment;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.PaymentStatus;
import com.taoke.course.repository.pay.PaymentRepository;
import com.taoke.course.service.order.OrderServiceImpl;
import com.taoke.course.service.pay.channel.WechatPayConfigFactory;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.notification.NotificationParser;
import com.wechat.pay.java.core.notification.RequestParam;
import com.wechat.pay.java.service.payments.model.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 第三方支付异步回调处理。
 *
 * @author Fangxinxin
 * @date 2026-06-25 10:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentNotifyService {

    private final PaymentProperties paymentProperties;
    private final PaymentRepository paymentRepository;
    private final OrderServiceImpl orderService;
    private final PayServiceImpl payService;

    /**
     * 处理支付宝异步通知，验签通过后更新支付与订单状态。
     */
    @Transactional
    public String handleAlipayNotify(Map<String, String> params) {
        if (!paymentProperties.isAlipayConfigured()) {
            log.warn("收到支付宝回调但渠道未配置");
            return "failure";
        }

        try {
            boolean verified = AlipaySignature.rsaCheckV1(
                    params,
                    paymentProperties.getAlipay().getAlipayPublicKey(),
                    "UTF-8",
                    "RSA2");
            if (!verified) {
                log.warn("支付宝回调验签失败: outTradeNo={}", params.get("out_trade_no"));
                return "failure";
            }
        } catch (Exception e) {
            log.error("支付宝回调验签异常", e);
            return "failure";
        }

        String tradeStatus = params.get("trade_status");
        if (!"TRADE_SUCCESS".equals(tradeStatus) && !"TRADE_FINISHED".equals(tradeStatus)) {
            return "success";
        }

        String paymentNo = params.get("out_trade_no");
        String tradeNo = params.get("trade_no");
        String totalAmount = params.get("total_amount");
        return markPaidIfValid(paymentNo, tradeNo, new BigDecimal(totalAmount)) ? "success" : "failure";
    }

    /**
     * 处理微信支付 V3 异步通知。
     */
    @Transactional
    public String handleWechatNotify(String body, String serial, String signature, String timestamp, String nonce) {
        if (!paymentProperties.isWechatConfigured()) {
            log.warn("收到微信回调但渠道未配置");
            return wechatFail();
        }

        try {
            Config config = WechatPayConfigFactory.build(paymentProperties);

            RequestParam requestParam = new RequestParam.Builder()
                    .serialNumber(serial)
                    .nonce(nonce)
                    .signature(signature)
                    .timestamp(timestamp)
                    .body(body)
                    .build();

            NotificationParser parser = new NotificationParser((com.wechat.pay.java.core.notification.NotificationConfig) config);
            Transaction transaction = parser.parse(requestParam, Transaction.class);

            if (transaction.getTradeState() != Transaction.TradeStateEnum.SUCCESS) {
                return wechatSuccess();
            }

            String paymentNo = transaction.getOutTradeNo();
            String tradeNo = transaction.getTransactionId();
            BigDecimal amountYuan = BigDecimal.valueOf(transaction.getAmount().getTotal())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            return markPaidIfValid(paymentNo, tradeNo, amountYuan) ? wechatSuccess() : wechatFail();
        } catch (Exception e) {
            log.error("微信回调处理异常", e);
            return wechatFail();
        }
    }

    private boolean markPaidIfValid(String paymentNo, String tradeNo, BigDecimal paidAmount) {
        Payment payment = paymentRepository.findByPaymentNo(paymentNo)
                .orElse(null);
        if (payment == null) {
            log.warn("回调支付流水不存在: paymentNo={}", paymentNo);
            return false;
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS.getValue()) {
            return true;
        }

        if (payment.getAmount().compareTo(paidAmount) != 0) {
            log.warn("回调金额不匹配: paymentNo={}, expected={}, actual={}",
                    paymentNo, payment.getAmount(), paidAmount);
            return false;
        }

        Order order = orderService.findByOrderNo(payment.getOrderNo());
        if (order.getStatus() != OrderStatus.PENDING.getValue()) {
            log.warn("订单状态非待支付: orderNo={}, status={}", order.getOrderNo(), order.getStatus());
            return false;
        }

        payment.setStatus(PaymentStatus.SUCCESS.getValue());
        payment.setTradeNo(tradeNo != null ? tradeNo : "");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        payService.onPaymentSuccess(order, payment);
        return true;
    }

    private static String wechatSuccess() {
        return "{\"code\":\"SUCCESS\",\"message\":\"成功\"}";
    }

    private static String wechatFail() {
        return "{\"code\":\"FAIL\",\"message\":\"失败\"}";
    }
}
