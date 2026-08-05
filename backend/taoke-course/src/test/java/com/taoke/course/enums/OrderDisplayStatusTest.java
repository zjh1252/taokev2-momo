package com.taoke.course.enums;

import com.taoke.course.entity.order.Order;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrderDisplayStatusTest {

    private final LocalDateTime now = LocalDateTime.of(2026, 7, 31, 12, 0);

    @Test
    void resolvePendingWhenPayWindowIsStillOpen() {
        Order order = order(OrderStatus.PENDING);
        order.setExpiredAt(now.plusMinutes(1));

        assertEquals(OrderDisplayStatus.PENDING, OrderDisplayStatus.resolve(order, now));
    }

    @Test
    void resolvePaymentExpiredForClosedPendingOrders() {
        Order order = order(OrderStatus.PENDING);
        order.setExpiredAt(now.minusSeconds(1));

        assertEquals(OrderDisplayStatus.PAYMENT_EXPIRED, OrderDisplayStatus.resolve(order, now));
    }

    @Test
    void resolvePaymentExpiredForExpiredStatus() {
        assertEquals(OrderDisplayStatus.PAYMENT_EXPIRED, OrderDisplayStatus.resolve(order(OrderStatus.EXPIRED), now));
    }

    @Test
    void resolveCourseExpiredByValidUntil() {
        Order order = order(OrderStatus.PAID);
        order.setPaidAt(now.minusMonths(1));
        order.setValidUntil(now.minusDays(1));

        assertEquals(OrderDisplayStatus.COURSE_EXPIRED, OrderDisplayStatus.resolve(order, now));
    }

    @Test
    void resolveCourseExpiredByPaidAtWhenValidUntilMissing() {
        Order order = order(OrderStatus.PAID);
        order.setPaidAt(now.minusYears(1).minusDays(1));

        assertEquals(OrderDisplayStatus.COURSE_EXPIRED, OrderDisplayStatus.resolve(order, now));
    }

    @Test
    void resolvePaidWhenCourseIsStillValid() {
        Order order = order(OrderStatus.PAID);
        order.setPaidAt(now.minusMonths(6));

        assertEquals(OrderDisplayStatus.PAID, OrderDisplayStatus.resolve(order, now));
    }

    @Test
    void resolveCancelledForCancelledAndRefundedOrders() {
        assertEquals(OrderDisplayStatus.CANCELLED, OrderDisplayStatus.resolve(order(OrderStatus.CANCELLED), now));
        assertEquals(OrderDisplayStatus.CANCELLED, OrderDisplayStatus.resolve(order(OrderStatus.REFUNDED), now));
    }

    private static Order order(OrderStatus status) {
        Order order = new Order();
        order.setStatus(status.getValue());
        return order;
    }
}
