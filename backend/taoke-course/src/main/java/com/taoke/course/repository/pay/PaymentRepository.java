package com.taoke.course.repository.pay;

import com.taoke.course.entity.pay.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 支付记录持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findByPaymentNo(String paymentNo);

    Optional<Payment> findByOrderId(Integer orderId);
}
