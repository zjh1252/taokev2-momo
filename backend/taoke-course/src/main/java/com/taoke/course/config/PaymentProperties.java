package com.taoke.course.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 支付渠道配置，绑定 {@code taoke.payment.*}。
 *
 * @author Fangxinxin
 * @date 2026-06-25 10:00
 */
@Data
@Component
@ConfigurationProperties(prefix = "taoke.payment")
public class PaymentProperties {

    /** 是否启用真实支付渠道（false 时 ALIPAY/WECHAT 不可用，MOCK 仍可用） */
    private boolean enabled = false;

    /** 后端对外 API 根地址，用于拼接 notify URL，如 https://api.taoke.com */
    private String apiBaseUrl = "http://localhost:8080";

    /** 前端站点根地址，用于支付宝 return_url，如 https://www.taoke.com */
    private String siteBaseUrl = "http://localhost:3000";

    private Alipay alipay = new Alipay();
    private Wechat wechat = new Wechat();

    public boolean isAlipayConfigured() {
        return enabled
                && StringUtils.hasText(alipay.getAppId())
                && StringUtils.hasText(alipay.getPrivateKey())
                && StringUtils.hasText(alipay.getAlipayPublicKey());
    }

    public boolean isWechatConfigured() {
        return enabled
                && StringUtils.hasText(wechat.getAppId())
                && StringUtils.hasText(wechat.getMchId())
                && StringUtils.hasText(wechat.getApiV3Key())
                && StringUtils.hasText(wechat.getMerchantSerialNumber())
                && StringUtils.hasText(wechat.getPrivateKey());
    }

    public boolean isWechatMiniProgramConfigured() {
        return isWechatConfigured() && StringUtils.hasText(wechat.getMiniProgramSecret());
    }

    public String alipayNotifyUrl() {
        return trimTrailingSlash(apiBaseUrl) + alipay.getNotifyPath();
    }

    public String alipayReturnUrl() {
        return trimTrailingSlash(siteBaseUrl) + alipay.getReturnPath();
    }

    public String alipayMobileReturnUrl(String orderNo) {
        String path = alipay.getMobileReturnPath();
        String base = trimTrailingSlash(siteBaseUrl) + path;
        return base + (path.contains("?") ? "&" : "?") + "orderNo=" + orderNo;
    }

    public String wechatNotifyUrl() {
        return trimTrailingSlash(apiBaseUrl) + wechat.getNotifyPath();
    }

    private static String trimTrailingSlash(String url) {
        if (!StringUtils.hasText(url)) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    @Data
    public static class Alipay {
        private String appId = "";
        /** 应用私钥（PKCS8，可含 PEM 头尾） */
        private String privateKey = "";
        /** 支付宝公钥 */
        private String alipayPublicKey = "";
        private String gatewayUrl = "https://openapi.alipay.com/gateway.do";
        private String notifyPath = "/payments/alipay/notify";
        private String returnPath = "/checkout";
        /** UniApp H5 / 支付宝 WAP 同步回跳页 */
        private String mobileReturnPath = "/pages/order/checkout";
    }

    @Data
    public static class Wechat {
        private String appId = "";
        private String mchId = "";
        private String apiV3Key = "";
        private String merchantSerialNumber = "";
        /** 商户 API 私钥 PEM 内容 */
        private String privateKey = "";
        /** 小程序 AppSecret，用于 code 换 openId */
        private String miniProgramSecret = "";
        private String notifyPath = "/payments/wechat/notify";
    }
}
