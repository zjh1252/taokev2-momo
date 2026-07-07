package com.taoke.course.enums;

import lombok.Getter;

/**
 * 商品类型枚举，统一标识订单/购物车中的商品来源。
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
public enum ProductType {

    OPEN_COURSE("公开课"),
    INTERNAL_COURSE("内训课"),
    VIDEO_COURSE("录播课"),
    VIDEO_PACKAGE("录播课系列");

    private final String label;

    ProductType(String label) {
        this.label = label;
    }
}
