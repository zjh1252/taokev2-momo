package com.taoke.course.enums;

import lombok.Getter;

/**
 * 订单状态枚举
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
public enum OrderStatus {

    PENDING(0, "待支付"),
    PAID(1, "已支付"),
    CANCELLED(2, "已取消"),
    REFUNDED(3, "已退款"),
    EXPIRED(4, "已过期");

    private final int value;
    private final String label;

    OrderStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public static OrderStatus of(int value) {
        for (OrderStatus s : values()) {
            if (s.value == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("未知订单状态: " + value);
    }
}
