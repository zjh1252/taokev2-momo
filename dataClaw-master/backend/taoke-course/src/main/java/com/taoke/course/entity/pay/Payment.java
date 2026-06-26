package com.taoke.course.entity.pay;

import com.taoke.common.entity.BaseEntity;
import com.taoke.course.enums.PaymentMethod;
import com.taoke.course.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付记录实体 — 对应 payments 表
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

    /** 支付流水号 */
    @Column(name = "payment_no", nullable = false, length = 32, unique = true)
    private String paymentNo;

    /** 关联订单ID */
    @Column(name = "order_id", nullable = false)
    private Integer orderId;

    /** 关联订单编号（冗余） */
    @Column(name = "order_no", nullable = false, length = 32)
    private String orderNo;

    /** 支付用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 支付金额 */
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    /** 支付方式 */
    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 20)
    private PaymentMethod method = PaymentMethod.MOCK;

    /** 支付状态 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = PaymentStatus.PENDING.getValue();

    /** 第三方交易号 */
    @Column(name = "trade_no", length = 100)
    private String tradeNo = "";

    /** 支付完成时间 */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
