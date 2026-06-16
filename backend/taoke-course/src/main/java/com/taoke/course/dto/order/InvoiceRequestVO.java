package com.taoke.course.dto.order;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 发票申请视图对象
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
@Data
public class InvoiceRequestVO {

    private Integer id;

    private String orderNo;

    /** 发票类型：SPECIAL / NORMAL */
    private String invoiceType;

    /** 抬头类型：PERSONAL / COMPANY */
    private String titleType;

    /** 开票金额 */
    private BigDecimal amount;

    /** 发票抬头 */
    private String title;

    private String taxNo;

    private String bankName;

    private String bankAccount;

    private String companyAddress;

    private String companyPhone;

    /** 接收发票的邮箱 */
    private String email;

    /** 状态：0=待审核 1=开具中 2=已开具 3=开具失败 4=已驳回 */
    private Integer status;

    private LocalDateTime createdAt;
}
