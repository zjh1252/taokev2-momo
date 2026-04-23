package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 专家经纪公司扩展信息实体 — ENTERPRISE_AGENT 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_enterprise_agents")
public class EnterpriseAgent extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    /** 公司名称 */
    @Column(name = "company_name", length = 128)
    private String companyName;

    /** 营业执照号 */
    @Column(name = "license_no", length = 64)
    private String licenseNo;

    /** 法人姓名 */
    @Column(name = "legal_person", length = 64)
    private String legalPerson;

    /** 所属行业 */
    @Column(name = "industry", length = 64)
    private String industry;

    /** 公司规模 */
    @Column(name = "company_size", length = 32)
    private String companySize;

    /** 公司简介 */
    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    /** 联系人姓名 */
    @Column(name = "contact_name", length = 64)
    private String contactName;

    /** 联系电话 */
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

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

    /** 公司详细地址 */
    @Column(name = "address", nullable = false, length = 200)
    private String address = "";

    /** 资质证明文件 URL（营业执照图片） */
    @Column(name = "qualification_doc_url", length = 512)
    private String qualificationDocUrl;

    // ============ 资质认证（公司Logo + 营业执照）— 整体审核 ============

    /** 公司 Logo URL */
    @Column(name = "cert_logo_url", length = 512)
    private String certLogoUrl;

    /**
     * 资质认证状态：NULL=未提交 1=待审核 2=已通过 3=已驳回
     * <p>对应 user_enterprise_agents.cert_status</p>
     */
    @Column(name = "cert_status", columnDefinition = "tinyint")
    private Integer certStatus;

    /** 资质认证驳回原因 */
    @Column(name = "cert_reject_reason", length = 255)
    private String certRejectReason;

    /** 资质认证最近一次提交时间 */
    @Column(name = "cert_submitted_at")
    private java.time.LocalDateTime certSubmittedAt;

    /** 资质认证最近一次审核时间 */
    @Column(name = "cert_audited_at")
    private java.time.LocalDateTime certAuditedAt;

    /** 注册经纪公司合作协议签署时间 */
    @Column(name = "agreement_signed_at")
    private java.time.LocalDateTime agreementSignedAt;

    /** 协议版本号，默认 v1 */
    @Column(name = "agreement_version", length = 32)
    private String agreementVersion;
}
