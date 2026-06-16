package com.taoke.course.entity.order;

import com.taoke.common.entity.BaseEntity;
import com.taoke.course.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单主表实体 — 对应 orders 表
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "orders")
public class Order extends BaseEntity {

    /** 订单编号 */
    @Column(name = "order_no", nullable = false, length = 32, unique = true)
    private String orderNo;

    /** 下单用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 订单原价合计 */
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** 实付金额 */
    @Column(name = "pay_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal payAmount = BigDecimal.ZERO;

    /** 订单状态 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = OrderStatus.PENDING.getValue();

    /** 用户备注 */
    @Column(name = "remark", length = 500)
    private String remark = "";

    /** 支付时间 */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /** 过期时间 */
    @Column(name = "expired_at")
    private LocalDateTime expiredAt;
}
