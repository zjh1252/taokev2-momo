package com.taoke.user.dto.alliance;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 721 讲师合作申请请求。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Data
public class AllianceLecturer721ApplyRequest {

    @NotBlank(message = "讲师姓名不能为空")
    @Size(max = 64, message = "讲师姓名不超过64个字符")
    private String lecturerName;

    @NotBlank(message = "身份证号不能为空")
    @Size(max = 32, message = "身份证号不超过32个字符")
    private String idCardNo;

    @NotNull(message = "请选择合作年限")
    @Min(value = 1, message = "合作年限无效")
    @Max(value = 3, message = "合作年限无效")
    private Integer coopYears;

    @NotNull(message = "课酬不能为空")
    private BigDecimal dailyFee;

    @NotBlank(message = "地址不能为空")
    @Size(max = 255, message = "地址不超过255个字符")
    private String address;

    @NotBlank(message = "手机号不能为空")
    @Size(max = 32, message = "手机号不超过32个字符")
    private String phone;

    @NotBlank(message = "微信不能为空")
    @Size(max = 64, message = "微信不超过64个字符")
    private String wechat;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 128, message = "邮箱不超过128个字符")
    private String email;

    @NotBlank(message = "开户银行不能为空")
    @Size(max = 128, message = "开户银行不超过128个字符")
    private String bankName;

    @NotBlank(message = "银行账号不能为空")
    @Size(max = 64, message = "银行账号不超过64个字符")
    private String bankAccount;

    @NotBlank(message = "请完成签字")
    @Size(max = 512, message = "签字地址过长")
    private String signatureUrl;

    @NotNull(message = "请确认是否同意协议")
    private Boolean agreementSigned;

    @Size(max = 32, message = "协议版本不超过32个字符")
    private String agreementVersion;
}
