package com.taoke.course.enums;

import lombok.Getter;

/**
 * 支付客户端类型，决定预下单接口形态。
 *
 * @author Fangxinxin
 * @date 2026-06-25 10:00
 */
@Getter
public enum PaymentClientType {

    PC("PC 网页"),
    H5("H5"),
    MINI_PROGRAM("微信小程序"),
    APP("原生 App");

    private final String label;

    PaymentClientType(String label) {
        this.label = label;
    }

    public static PaymentClientType from(String value) {
        if (value == null || value.isBlank()) {
            return PC;
        }
        return PaymentClientType.valueOf(value.trim().toUpperCase());
    }
}
