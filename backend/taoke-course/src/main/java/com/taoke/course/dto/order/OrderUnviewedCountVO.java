package com.taoke.course.dto.order;

import lombok.Data;

/**
 * 我的订单未查看分类数量
 *
 * @author Fangxinxin
 * @date 2026-07-31 17:00
 */
@Data
public class OrderUnviewedCountVO {

    private long pending;

    private long paymentExpired;

    private long courseExpired;

    private long paid;

    private long cancelled;
}
