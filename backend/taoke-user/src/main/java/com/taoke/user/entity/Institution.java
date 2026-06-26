package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 机构扩展信息实体 — INSTITUTION 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_institutions")
public class Institution extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    /** 老站 tk_member.roleid，对应 URL /company/{roleid}.htm */
    @Column(name = "legacy_role_id", nullable = false)
    private Integer legacyRoleId = 0;

    /** 机构名称 */
    @Column(name = "org_name", length = 128)
    private String orgName;

    /** 机构类型：0=非高校，1=高校 */
    @Column(name = "org_type", nullable = false, columnDefinition = "tinyint")
    private Integer orgType = 0;

    /** 营业执照号 */
    @Column(name = "license_no", length = 64)
    private String licenseNo;

    /** 法人代表 */
    @Column(name = "legal_representative", length = 64)
    private String legalRepresentative;

    /** 机构成立日期 */
    @Column(name = "established_at")
    private LocalDate establishedAt;

    /** 机构简介（支持富文本） */
    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    /** 主页配置 */
    @Column(name = "homepage_config", columnDefinition = "json")
    private String homepageConfig;

    /** 联系人姓名 */
    @Column(name = "contact_name", length = 64)
    private String contactName;

    /** 联系电话 */
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    /** 是否公开联系方式：0=不公开，1=公开 */
    @Column(name = "show_contact", nullable = false, columnDefinition = "tinyint")
    private Integer showContact = 0;

    /** 公司所在邮编 */
    @Column(name = "post_code", nullable = false, length = 10)
    private String postCode = "";

    /** 公司所在省份 */
    @Column(name = "province_id", nullable = false)
    private Integer provinceId = 0;

    /** 公司所在城市 */
    @Column(name = "city_id", nullable = false)
    private Integer cityId = 0;

    /** 公司所在区县 */
    @Column(name = "district_id", nullable = false)
    private Integer districtId = 0;

    /** 公司所在乡镇 */
    @Column(name = "town_id", nullable = false)
    private Integer townId = 0;

    /** 详细地址 */
    @Column(name = "address", nullable = false, length = 200)
    private String address = "";

    /** 擅长领域 — 分类 ID 逗号串（一级多选，复用 TRAINER_EXPERTISE 分类树） */
    @Column(name = "specialties", length = 512)
    private String specialties;

    /** 擅长行业 — 分类 ID 逗号串（一级多选，复用 TRAINER_INDUSTRY 分类树） */
    @Column(name = "industries", length = 512)
    private String industries;

    /** 是否有场地：0=否，1=是 */
    @Column(name = "has_venue", nullable = false, columnDefinition = "tinyint")
    private Integer hasVenue = 0;

    /** 是否有专家：0=否，1=是 */
    @Column(name = "has_experts", nullable = false, columnDefinition = "tinyint")
    private Integer hasExperts = 0;

    /** 综合评分（0.00-5.00） */
    @Column(name = "score", nullable = false, precision = 3, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    /** 浏览量/人气 */
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    /** 评价数量 */
    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    /** 公开课数量 */
    @Column(name = "open_course_count", nullable = false)
    private Integer openCourseCount = 0;

    /** 内训课数量 */
    @Column(name = "inner_course_count", nullable = false)
    private Integer innerCourseCount = 0;

    /** 机构 Logo URL */
    @Column(name = "logo_url", length = 512)
    private String logoUrl;

    /** 机构横幅图 URL */
    @Column(name = "banner_url", length = 512)
    private String bannerUrl;

    /** 是否已认证：0=否，1=是 */
    @Column(name = "is_certified", nullable = false, columnDefinition = "tinyint")
    private Integer isCertified = 0;

    /** 是否金牌推荐：0=否，1=是 */
    @Column(name = "is_recommended", nullable = false, columnDefinition = "tinyint")
    private Integer isRecommended = 0;

    /** 排序权重，值越大越靠前 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 状态：0=待审核，1=已发布，2=已下线 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 0;

    /** 是否在 C 端机构频道公开展示（排除仅专家发课、无机构主体的迁移行） */
    @Column(name = "public_list_eligible", nullable = false, columnDefinition = "tinyint(1)")
    private Boolean publicListEligible = true;

    /** 服务过的客户描述 */
    @Column(name = "client_cases", columnDefinition = "text")
    private String clientCases;

    /** 成功案例（长文本，机构详情页对外展示） */
    @Column(name = "success_cases", columnDefinition = "text")
    private String successCases;

    /** 是否培训协会 */
    @Column(name = "association", nullable = false, columnDefinition = "tinyint(1)")
    private Boolean association = false;

    /** 注册培训机构合作协议签署时间 */
    @Column(name = "agreement_signed_at")
    private LocalDateTime agreementSignedAt;

    /** 协议版本号，默认 v1 */
    @Column(name = "agreement_version", length = 32)
    private String agreementVersion;

    // ============ 公司资料认证 — 整体审核字段 ============

    /** 公司性质：国企/民营/外资/合资/事业单位/其他 */
    @Column(name = "company_nature", length = 32)
    private String companyNature;

    /** 公司网址 */
    @Column(name = "website", length = 255)
    private String website;

    /** 机构规模 */
    @Column(name = "company_size", length = 32)
    private String companySize;

    /** 年营业额（如：500-1000万） */
    @Column(name = "annual_revenue", length = 64)
    private String annualRevenue;

    /** 注册资本 */
    @Column(name = "registered_capital", length = 64)
    private String registeredCapital;

    /** 公开课最高佣金比例 0-100 */
    @Column(name = "max_commission_rate", precision = 5, scale = 2)
    private java.math.BigDecimal maxCommissionRate;

    /** 可接受付款方式 — JSON 字符串数组（如 ["对公转账","支付宝","微信"]） */
    @Column(name = "payment_methods", columnDefinition = "json")
    private String paymentMethods;

    /** 是否有版权课：0=否 1=是 */
    @Column(name = "has_copyright_course", columnDefinition = "tinyint")
    private Integer hasCopyrightCourse = 0;

    /** 银行卡号 */
    @Column(name = "bank_card_no", length = 64)
    private String bankCardNo;

    /** 开户行 */
    @Column(name = "bank_name", length = 128)
    private String bankName;

    /** 开户行支行 */
    @Column(name = "bank_branch", length = 128)
    private String bankBranch;

    /** 营业执照附件 URL（license_no 是号码字符串） */
    @Column(name = "license_doc_url", length = 512)
    private String licenseDocUrl;

    /**
     * 公司资料整体审核状态：NULL=未提交 1=待审核 2=已通过 3=已驳回
     */
    @Column(name = "company_info_status", columnDefinition = "tinyint")
    private Integer companyInfoStatus;

    /** 公司资料驳回原因 */
    @Column(name = "company_info_reject_reason", length = 255)
    private String companyInfoRejectReason;

    /** 公司资料最近一次提交时间 */
    @Column(name = "company_info_submitted_at")
    private LocalDateTime companyInfoSubmittedAt;

    /** 公司资料最近一次审核时间 */
    @Column(name = "company_info_audited_at")
    private LocalDateTime companyInfoAuditedAt;
}
