package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 721 讲师合作申请实体。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "alliance_lecturer721_applications")
public class AllianceLecturer721Application extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "application_code", nullable = false, length = 64)
    private String applicationCode;

    @Column(name = "lecturer_name", nullable = false, length = 64)
    private String lecturerName;

    @Column(name = "id_card_no", nullable = false, length = 32)
    private String idCardNo;

    @Column(name = "coop_years", nullable = false, columnDefinition = "tinyint(2)")
    private Integer coopYears;

    @Column(name = "daily_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal dailyFee;

    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "phone", nullable = false, length = 32)
    private String phone;

    @Column(name = "wechat", nullable = false, length = 64)
    private String wechat;

    @Column(name = "email", nullable = false, length = 128)
    private String email;

    @Column(name = "bank_name", nullable = false, length = 128)
    private String bankName;

    @Column(name = "bank_account", nullable = false, length = 64)
    private String bankAccount;

    @Column(name = "signature_url", nullable = false, length = 512)
    private String signatureUrl;

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
