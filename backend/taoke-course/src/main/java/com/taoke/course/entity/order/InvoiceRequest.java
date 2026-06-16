package com.taoke.course.entity.order;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 发票申请实体 — 对应 invoice_requests 表
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "invoice_requests")
public class InvoiceRequest extends BaseEntity {

    /** 订单 ID */
    @Column(name = "order_id", nullable = false)
    private Integer orderId;

    /** 订单编号 */
    @Column(name = "order_no", nullable = false, length = 32)
    private String orderNo;

    /** 申请用户 ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 发票类型：SPECIAL=全电发票-增值税专用发票 NORMAL=全电发票-普通发票 */
    @Column(name = "invoice_type", nullable = false, length = 20)
    private String invoiceType;

    /** 抬头类型：PERSONAL=个人 COMPANY=企业 */
    @Column(name = "title_type", nullable = false, length = 20)
    private String titleType;

    /** 开票金额（订单实付金额，不可修改） */
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** 发票抬头 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 纳税人识别号（企业抬头） */
    @Column(name = "tax_no", length = 50)
    private String taxNo = "";

    /** 开户银行（企业抬头） */
    @Column(name = "bank_name", length = 100)
    private String bankName = "";

    /** 银行账号（企业抬头） */
    @Column(name = "bank_account", length = 50)
    private String bankAccount = "";

    /** 企业地址（企业抬头） */
    @Column(name = "company_address", length = 255)
    private String companyAddress = "";

    /** 企业电话（企业抬头） */
    @Column(name = "company_phone", length = 30)
    private String companyPhone = "";

    /** 接收发票的邮箱 */
    @Column(name = "email", nullable = false, length = 100)
    private String email;

    /** 状态：0=待审核 1=开具中 2=已开具 3=开具失败 4=已驳回 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 0;

    @Column(name = "reject_reason", nullable = false, length = 500)
    private String rejectReason = "";

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "invoice_file_url", nullable = false, length = 500)
    private String invoiceFileUrl = "";
}
