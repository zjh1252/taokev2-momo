package com.taoke.user.dto.alliance;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 培训合伙人申请请求。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:00
 */
@Data
public class AlliancePartnerApplyRequest {

    @NotBlank(message = "联系人名字不能为空")
    @Size(max = 64, message = "联系人名字不超过64个字符")
    private String contactName;

    @NotBlank(message = "公司名称不能为空")
    @Size(max = 128, message = "公司名称不超过128个字符")
    private String companyName;

    @NotBlank(message = "公司电话不能为空")
    @Size(max = 32, message = "公司电话不超过32个字符")
    private String companyPhone;

    @NotBlank(message = "公司邮箱不能为空")
    @Email(message = "公司邮箱格式不正确")
    @Size(max = 128, message = "公司邮箱不超过128个字符")
    private String companyEmail;

    @NotNull(message = "请选择省份")
    private Integer provinceId;

    @NotNull(message = "请选择城市")
    private Integer cityId;

    @NotBlank(message = "公司法人不能为空")
    @Size(max = 64, message = "公司法人不超过64个字符")
    private String legalPerson;

    @NotBlank(message = "法人身份证不能为空")
    @Size(max = 32, message = "法人身份证不超过32个字符")
    private String legalIdCard;

    @Size(max = 32, message = "联系人 QQ 不超过32个字符")
    private String contactQq;

    @NotNull(message = "请确认是否同意协议")
    private Boolean agreementSigned;

    @Size(max = 32, message = "协议版本不超过32个字符")
    private String agreementVersion;
}
