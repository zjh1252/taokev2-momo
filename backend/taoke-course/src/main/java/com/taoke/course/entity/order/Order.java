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

    /** 培训宝 root_company_id（legacy 订单隔离，0=不限） */
    @Column(name = "pxb_root_id", nullable = false)
    private Integer pxbRootId = 0;

    @Column(name = "pxb_kefu", nullable = false, length = 64)
    private String pxbKefu = "";

    @Column(name = "pxb_remarks", nullable = false, length = 500)
    private String pxbRemarks = "";

    @Column(name = "concurrency", nullable = false)
    private Integer concurrency = 1;

    @Column(name = "copy_root_id", nullable = false)
    private Integer copyRootId = 0;

    @Column(name = "order_subject", nullable = false, length = 200)
    private String orderSubject = "";

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    /** 老站 status 快照：3=已支付 -1=过期 */
    @Column(name = "legacy_status", columnDefinition = "TINYINT")
    private Integer legacyStatus;

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
