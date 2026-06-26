package com.taoke.course.service.pay.channel;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.enums.PaymentMethod;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * 支付渠道路由。
 *
 * @author Fangxinxin
 * @date 2026-06-25 10:00
 */
@Component
public class PaymentChannelRegistry {

    private final Map<PaymentMethod, PaymentChannel> channels = new EnumMap<>(PaymentMethod.class);

    public PaymentChannelRegistry(List<PaymentChannel> channelList) {
        for (PaymentChannel channel : channelList) {
            channels.put(channel.method(), channel);
        }
    }

    public PaymentChannel require(PaymentMethod method) {
        PaymentChannel channel = channels.get(method);
        if (channel == null || !channel.isConfigured()) {
            throw new BusinessException(ErrorCode.PAYMENT_CHANNEL_NOT_CONFIGURED);
        }
        return channel;
    }
}
