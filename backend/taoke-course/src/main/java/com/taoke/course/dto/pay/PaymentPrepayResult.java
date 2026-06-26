package com.taoke.course.dto.pay;

import lombok.Data;

/**
 * 第三方支付预下单结果（内部使用）。
 *
 * @author Fangxinxin
 * @date 2026-06-25 10:00
 */
@Data
public class PaymentPrepayResult {

    /** 支付宝 PC/H5 跳转地址 */
    private String payUrl;

    /** 微信 Native 扫码 code_url */
    private String qrCodeUrl;

    /** 微信 JSAPI 调起参数（timeStamp / nonceStr / package / signType / paySign） */
    private java.util.Map<String, String> payParams;
}
