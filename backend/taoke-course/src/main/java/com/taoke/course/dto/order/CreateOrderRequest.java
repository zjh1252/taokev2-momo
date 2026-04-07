package com.taoke.course.dto.order;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 创建订单请求体
 * <p>
 * 支持两种模式：
 * <ul>
 *     <li>从购物车下单：传 cartItemIds</li>
 *     <li>直接购买：传 directItem</li>
 * </ul>
 * 两者不能同时为空。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Data
public class CreateOrderRequest {

    /** 从购物车结算时传入的购物车条目ID列表 */
    private List<Integer> cartItemIds;

    /** 直接购买时的商品信息 */
    private DirectItem directItem;

    /** 用户备注 */
    private String remark;

    @Data
    public static class DirectItem {
        private String productType;
        private Integer productId;
        private Integer quantity = 1;
    }
}
