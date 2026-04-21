package com.taoke.user.dto.institution;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存机构信息请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class InstitutionRequest {

    @Size(max = 128, message = "机构名称不超过128个字符")
    private String orgName;

    /** 机构类型：0=非高校，1=高校 */
    private Integer orgType;

    @Size(max = 64, message = "营业执照号不超过64个字符")
    private String licenseNo;

    /** 机构简介（支持富文本） */
    private String bio;

    /** 主页配置（JSON 字符串） */
    private String homepageConfig;

    @Size(max = 64, message = "联系人姓名不超过64个字符")
    private String contactName;

    @Size(max = 20, message = "联系电话不超过20个字符")
    private String contactPhone;

    /** 是否公开联系方式：0=不公开，1=公开 */
    private Integer showContact;

    @Size(max = 10, message = "邮编不超过10个字符")
    private String postCode;

    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;

    @Size(max = 200, message = "详细地址不超过200个字符")
    private String address;

    /** 服务过的客户描述（部分客户，长文本） */
    private String clientCases;

    /** 成功案例（长文本） */
    private String successCases;
}
