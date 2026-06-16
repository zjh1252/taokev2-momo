package com.taoke.course.dto.order;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 发票申请请求体
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
@Data
public class CreateInvoiceRequest {

    /** 发票类型：SPECIAL=全电发票-增值税专用发票 NORMAL=全电发票-普通发票 */
    @NotBlank(message = "发票类型不能为空")
    @Pattern(regexp = "SPECIAL|NORMAL", message = "发票类型不合法")
    private String invoiceType;

    /** 抬头类型：PERSONAL=个人 COMPANY=企业 */
    @NotBlank(message = "抬头类型不能为空")
    @Pattern(regexp = "PERSONAL|COMPANY", message = "抬头类型不合法")
    private String titleType;

    /** 发票抬头 */
    @NotBlank(message = "发票抬头不能为空")
    private String title;

    /** 纳税人识别号（企业抬头必填） */
    private String taxNo;

    /** 开户银行（企业抬头） */
    private String bankName;

    /** 银行账号（企业抬头） */
    private String bankAccount;

    /** 企业地址（企业抬头） */
    private String companyAddress;

    /** 企业电话（企业抬头） */
    private String companyPhone;

    /** 接收发票的邮箱 */
    @NotBlank(message = "接收发票的邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}
