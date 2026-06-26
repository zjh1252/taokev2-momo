package com.taoke.course.dto.order;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单列表/详情视图对象
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Data
public class OrderVO {

    private Integer id;

    /** 订单编号 */
    private String orderNo;

    /** 订单原价合计 */
    private BigDecimal totalAmount;

    /** 实付金额 */
    private BigDecimal payAmount;

    /** 订单状态 */
    private Integer status;

    /** 订单状态标签 */
    private String statusLabel;

    /** 用户备注 */
    private String remark;

    /** 支付时间 */
    private LocalDateTime paidAt;

    /** 过期时间 */
    private LocalDateTime expiredAt;

    private LocalDateTime createdAt;

    /** 订单明细列表 */
    private List<OrderItemVO> items;
}
