package com.taoke.course.dto.order;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 订单明细视图对象
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Data
public class OrderItemVO {

    private Integer id;

    /** 商品类型 */
    private String productType;

    /** 商品类型标签 */
    private String productTypeLabel;

    /** 商品ID */
    private Integer productId;

    /** 商品标题 */
    private String productTitle;

    /** 商品封面 */
    private String productCover;

    /** 单价 */
    private BigDecimal price;

    /** 数量 */
    private Integer quantity;

    /** 小计 */
    private BigDecimal subtotal;
}
