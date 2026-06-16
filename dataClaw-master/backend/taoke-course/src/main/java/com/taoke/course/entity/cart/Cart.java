package com.taoke.course.entity.cart;

import com.taoke.common.entity.BaseEntity;
import com.taoke.course.enums.ProductType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 购物车实体 — 对应 carts 表
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "carts")
public class Cart extends BaseEntity {

    /** 用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 商品类型 */
    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 20)
    private ProductType productType;

    /** 商品ID */
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    /** 商品标题（冗余快照） */
    @Column(name = "product_title", nullable = false, length = 200)
    private String productTitle = "";

    /** 商品封面（冗余快照） */
    @Column(name = "product_cover", length = 500)
    private String productCover = "";

    /** 加入时单价快照 */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    /** 数量 */
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;
}
