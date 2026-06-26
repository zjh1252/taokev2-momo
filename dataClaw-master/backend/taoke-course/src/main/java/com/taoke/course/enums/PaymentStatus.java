package com.taoke.course.enums;

import lombok.Getter;

/**
 * 支付状态枚举
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
public enum PaymentStatus {

    PENDING(0, "待支付"),
    SUCCESS(1, "支付成功"),
    FAILED(2, "支付失败"),
    REFUNDED(3, "已退款");

    private final int value;
    private final String label;

    PaymentStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public static PaymentStatus of(int value) {
        for (PaymentStatus s : values()) {
            if (s.value == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知支付状态: " + value);
    }
}
