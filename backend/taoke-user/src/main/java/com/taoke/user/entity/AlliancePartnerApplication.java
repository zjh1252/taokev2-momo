package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;

/**
 * 培训合伙人申请实体。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "alliance_partner_applications")
public class AlliancePartnerApplication extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "partner_code", nullable = false, length = 64)
    private String partnerCode;

    @Column(name = "contact_name", nullable = false, length = 64)
    private String contactName;

    @Column(name = "company_name", nullable = false, length = 128)
    private String companyName;

    @Column(name = "company_phone", nullable = false, length = 32)
    private String companyPhone;

    @Column(name = "company_email", nullable = false, length = 128)
    private String companyEmail;

    @Column(name = "province_id", nullable = false)
    private Integer provinceId;

    @Column(name = "city_id", nullable = false)
    private Integer cityId;

    @Column(name = "legal_person", nullable = false, length = 64)
    private String legalPerson;

    @Column(name = "legal_id_card", nullable = false, length = 32)
    private String legalIdCard;

    @Column(name = "contact_qq", length = 32)
    private String contactQq;

    @Column(name = "agreement_version", nullable = false, length = 32)
    private String agreementVersion;

    /** 1=待审核，2=已通过，3=已驳回。 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status;

    @Column(name = "reject_reason", length = 512)
    private String rejectReason;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private Integer reviewedBy;
}
