package com.taoke.course.dto.order;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 管理后台发票申请列表项
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class AdminInvoiceListItemVO {

    private Integer id;

    private Integer orderId;

    private String orderNo;

    private Integer userId;

    private String userName;

    private String videoTitle;

    private String invoiceType;

    private String invoiceTypeLabel;

    private String titleType;

    private String titleTypeLabel;

    private BigDecimal amount;

    private String title;

    private String taxNo;

    private String bankName;

    private String bankAccount;

    private String companyAddress;

    private String companyPhone;

    private String email;

    private Integer status;

    private String statusLabel;

    private String rejectReason;

    private LocalDateTime issuedAt;

    private String invoiceFileUrl;

    private LocalDateTime createdAt;
}
