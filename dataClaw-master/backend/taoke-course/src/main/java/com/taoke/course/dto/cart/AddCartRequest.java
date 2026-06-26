package com.taoke.course.dto.cart;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 添加购物车请求体
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Data
public class AddCartRequest {

    /** 商品类型：OPEN_COURSE / VIDEO_COURSE */
    @NotBlank(message = "商品类型不能为空")
    private String productType;

    /** 商品ID */
    @NotNull(message = "商品ID不能为空")
    private Integer productId;

    /** 数量，默认1 */
    private Integer quantity = 1;
}
