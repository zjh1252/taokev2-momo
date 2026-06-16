package com.taoke.course.dto.cart;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 购物车条目视图对象
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Data
public class CartItemVO {

    private Integer id;

    /** 商品类型 */
    private String productType;

    /** 商品类型中文标签 */
    private String productTypeLabel;

    /** 商品ID */
    private Integer productId;

    /** 商品标题 */
    private String productTitle;

    /** 商品封面 */
    private String productCover;

    /** 单价 */
    private BigDecimal price;

    /** 当前最新价格（用于比对是否变价） */
    private BigDecimal currentPrice;

    /** 数量 */
    private Integer quantity;

    /** 小计 */
    private BigDecimal subtotal;

    private LocalDateTime createdAt;
}
