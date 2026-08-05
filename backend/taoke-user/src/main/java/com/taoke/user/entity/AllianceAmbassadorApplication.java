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
 * 推广大使申请实体。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "alliance_ambassador_applications")
public class AllianceAmbassadorApplication extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "ambassador_code", nullable = false, length = 64)
    private String ambassadorCode;

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
