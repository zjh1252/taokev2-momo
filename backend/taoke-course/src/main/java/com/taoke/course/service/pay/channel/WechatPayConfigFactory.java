package com.taoke.course.service.pay.channel;

import com.taoke.course.config.PaymentProperties;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.RSAAutoCertificateConfig;
import com.wechat.pay.java.core.util.PemUtil;

/**
 * 微信支付 SDK Config 工厂。
 *
 * @author Fangxinxin
 * @date 2026-06-25 14:00
 */
public final class WechatPayConfigFactory {

    private WechatPayConfigFactory() {
    }

    public static Config build(PaymentProperties paymentProperties) {
        PaymentProperties.Wechat cfg = paymentProperties.getWechat();
        return new RSAAutoCertificateConfig.Builder()
                .merchantId(cfg.getMchId())
                .privateKey(PemUtil.loadPrivateKeyFromString(cfg.getPrivateKey()))
                .merchantSerialNumber(cfg.getMerchantSerialNumber())
                .apiV3Key(cfg.getApiV3Key())
                .build();
    }
}
