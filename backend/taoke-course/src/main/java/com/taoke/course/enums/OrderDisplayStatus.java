package com.taoke.course.enums;

import com.taoke.course.entity.order.Order;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 订单前台展示分类
 *
 * @author Fangxinxin
 * @date 2026-07-31 16:55
 */
@Getter
public enum OrderDisplayStatus {

    PENDING("待支付"),
    PAYMENT_EXPIRED("支付过期"),
    COURSE_EXPIRED("过期课程"),
    PAID("已完成"),
    CANCELLED("已取消");

    private final String label;

    OrderDisplayStatus(String label) {
        this.label = label;
    }

    public static OrderDisplayStatus of(String value) {
        for (OrderDisplayStatus status : values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("未知订单展示状态: " + value);
    }

    public static OrderDisplayStatus resolve(Order order, LocalDateTime now) {
        OrderStatus status = OrderStatus.of(order.getStatus());
        if (status == OrderStatus.PENDING) {
            return isPaymentExpired(order, now) ? PAYMENT_EXPIRED : PENDING;
        }
        if (status == OrderStatus.EXPIRED) {
            return PAYMENT_EXPIRED;
        }
        if (status == OrderStatus.PAID) {
            return isCourseExpired(order, now) ? COURSE_EXPIRED : PAID;
        }
        if (status == OrderStatus.CANCELLED || status == OrderStatus.REFUNDED) {
            return CANCELLED;
        }
        return CANCELLED;
    }

    private static boolean isPaymentExpired(Order order, LocalDateTime now) {
        return order.getExpiredAt() != null && !order.getExpiredAt().isAfter(now);
    }

    private static boolean isCourseExpired(Order order, LocalDateTime now) {
        LocalDateTime expiresAt = order.getValidUntil();
        if (expiresAt == null && order.getPaidAt() != null) {
            expiresAt = order.getPaidAt().plusYears(1);
        }
        return expiresAt != null && !expiresAt.isAfter(now);
    }
}
