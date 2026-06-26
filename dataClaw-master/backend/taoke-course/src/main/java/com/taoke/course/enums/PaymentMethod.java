package com.taoke.course.enums;

import lombok.Getter;

/**
 * 支付方式枚举
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
public enum PaymentMethod {

    MOCK("模拟支付"),
    ALIPAY("支付宝"),
    WECHAT("微信支付");

    private final String label;

    PaymentMethod(String label) {
        this.label = label;
    }
}
