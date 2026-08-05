package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 企业培训采购方扩展信息实体 — ENTERPRISE_BUYER 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_enterprise_buyers")
public class EnterpriseBuyer extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    @Column(name = "company_name", length = 128)
    private String companyName;

    @Column(name = "industry", length = 64)
    private String industry;

    @Column(name = "company_size", length = 32)
    private String companySize;

    @Column(name = "contact_name", length = 64)
    private String contactName;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "post_code", nullable = false, length = 10)
    private String postCode = "";

    @Column(name = "province_id", nullable = false)
    private Integer provinceId = 0;

    @Column(name = "city_id", nullable = false)
    private Integer cityId = 0;

    @Column(name = "district_id", nullable = false)
    private Integer districtId = 0;

    @Column(name = "town_id", nullable = false)
    private Integer townId = 0;

    @Column(name = "address", nullable = false, length = 200)
    private String address = "";

    /** 培训需求标签，JSON 数组 */
    @Column(name = "training_tags", length = 512)
    private String trainingTags;

    // ==================== 实名认证 ====================

    @Column(name = "id_card_no", length = 32)
    private String idCardNo;

    @Column(name = "id_card_front", length = 500)
    private String idCardFront;

    @Column(name = "id_card_back", length = 500)
    private String idCardBack;

    /** 实名认证状态：NULL=未提交 1=待审核 2=已通过 3=已驳回 */
    @Column(name = "real_name_status", columnDefinition = "tinyint")
    private Integer realNameStatus;

    @Column(name = "real_name_reject_reason", length = 255)
    private String realNameRejectReason;

    @Column(name = "real_name_submitted_at")
    private LocalDateTime realNameSubmittedAt;

    @Column(name = "real_name_audited_at")
    private LocalDateTime realNameAuditedAt;
}
