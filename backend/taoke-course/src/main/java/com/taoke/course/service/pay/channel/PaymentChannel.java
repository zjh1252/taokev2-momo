package com.taoke.course.service.pay.channel;

import com.taoke.course.dto.pay.PaymentPrepayResult;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.pay.Payment;
import com.taoke.course.enums.PaymentClientType;
import com.taoke.course.enums.PaymentMethod;

/**
 * 第三方支付渠道抽象。
 *
 * @author Fangxinxin
 * @date 2026-06-25 10:00
 */
public interface PaymentChannel {

    PaymentMethod method();

    boolean isConfigured();

    PaymentPrepayResult prepay(
            Payment payment,
            Order order,
            String subject,
            PaymentClientType clientType,
            String openId);
}
