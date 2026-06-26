package com.taoke.user.dto.institution;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * 保存机构信息请求 — 培训机构角色申请 / 资料更新统一入参。
 *
 * <p>本期新增：法人代表 / 成立时间 / Logo / 行业领域分类 ID 多选 / 我的客户
 * （已有）/ 是否有场地 / 是否有专家 / 合作协议签署。</p>
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class InstitutionRequest {

    @Size(max = 128, message = "机构名称不超过128个字符")
    private String orgName;

    /** 机构类型 */
    private Integer orgType;

    /** 法人代表 */
    @Size(max = 64, message = "法人代表姓名不超过64个字符")
    private String legalRepresentative;

    @Pattern(regexp = "^(\\d{15}|[A-Z\\d]{18})?$", message = "营业执照号需为15位纯数字或18位大写统一社会信用代码")
    @Size(max = 64, message = "营业执照号不超过64个字符")
    private String licenseNo;

    /** 机构成立日期（YYYY-MM-DD） */
    private LocalDate establishedAt;

    /** 机构 Logo URL */
    @Size(max = 512, message = "Logo URL 不超过512个字符")
    private String logoUrl;

    /** 营业执照附件 URL（图片） */
    @Size(max = 512, message = "营业执照 URL 不超过512个字符")
    private String licenseDocUrl;

    /** 机构简介（支持富文本） */
    private String bio;

    /** 擅长行业 — 一级分类 ID 多选（复用 TRAINER_INDUSTRY 分类树） */
    private List<Integer> industryCategoryIds;

    /** 擅长领域 — 一级分类 ID 多选（复用 TRAINER_EXPERTISE 分类树） */
    private List<Integer> expertiseCategoryIds;

    /** 是否有场地：0=否，1=是 */
    private Integer hasVenue;

    /** 是否有专家：0=否，1=是 */
    private Integer hasExperts;

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

    /** 是否已勾选《淘课网注册培训机构合作协议》 */
    private Boolean agreementSigned;

    /** 协议版本号；默认 v1 */
    @Size(max = 32, message = "协议版本号不超过32个字符")
    private String agreementVersion;
}
