package com.taoke.user.dto.enterpriseagent;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存专家经纪公司信息请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class EnterpriseAgentRequest {

    @Size(max = 128, message = "公司名称不超过128个字符")
    private String companyName;

    @Size(max = 64, message = "营业执照号不超过64个字符")
    private String licenseNo;

    @Size(max = 64, message = "法人姓名不超过64个字符")
    private String legalPerson;

    @Size(max = 64, message = "所属行业不超过64个字符")
    private String industry;

    @Size(max = 32, message = "公司规模不超过32个字符")
    private String companySize;

    /** 公司简介 */
    private String bio;

    @Size(max = 64, message = "联系人姓名不超过64个字符")
    private String contactName;

    @Size(max = 20, message = "联系电话不超过20个字符")
    private String contactPhone;

    @Size(max = 10, message = "邮编不超过10个字符")
    private String postCode;

    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;

    @Size(max = 200, message = "详细地址不超过200个字符")
    private String address;

    @Size(max = 512, message = "资质证明文件 URL 不超过512个字符")
    private String qualificationDocUrl;

    /** 是否同意《淘课网注册专家经纪公司合作协议》（apply 时必须为 true） */
    private Boolean agreementSigned;

    /** 协议版本号，前端默认 v1 */
    @Size(max = 32, message = "协议版本号不超过32个字符")
    private String agreementVersion;
}
