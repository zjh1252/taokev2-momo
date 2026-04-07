package com.taoke.course.dto.pay;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付结果视图对象
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Data
public class PayResultVO {

    /** 支付流水号 */
    private String paymentNo;

    /** 订单编号 */
    private String orderNo;

    /** 支付金额 */
    private BigDecimal amount;

    /** 支付方式 */
    private String method;

    /** 支付状态：0=待支付 1=支付成功 2=支付失败 */
    private Integer status;

    /** 支付状态标签 */
    private String statusLabel;

    /** 支付完成时间 */
    private LocalDateTime paidAt;
}
