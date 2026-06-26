package com.taoke.course.entity.order;

import com.taoke.common.entity.BaseEntity;
import com.taoke.course.enums.ProductType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 订单明细实体 — 对应 order_items 表
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "order_items")
public class OrderItem extends BaseEntity {

    /** 关联订单ID */
    @Column(name = "order_id", nullable = false)
    private Integer orderId;

    /** 商品类型 */
    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 20)
    private ProductType productType;

    /** 商品ID */
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    /** 商品标题（下单快照） */
    @Column(name = "product_title", nullable = false, length = 200)
    private String productTitle = "";

    /** 商品封面（下单快照） */
    @Column(name = "product_cover", length = 500)
    private String productCover = "";

    /** 下单时单价 */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    /** 数量 */
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    /** 小计金额 */
    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;
}
