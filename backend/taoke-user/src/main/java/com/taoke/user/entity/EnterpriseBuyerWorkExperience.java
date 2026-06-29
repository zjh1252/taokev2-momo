package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 企业培训采购方工作认证记录（按记录审核）。
 *
 * @author Fangxinxin
 * @date 2026-06-27 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "enterprise_buyer_work_experiences")
public class EnterpriseBuyerWorkExperience extends BaseEntity {

    @Column(name = "buyer_id", nullable = false)
    private Integer buyerId;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "position", length = 100)
    private String position;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "job_description", columnDefinition = "text")
    private String jobDescription;

    @Column(name = "proof_file", length = 500)
    private String proofFile;

    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 1;

    @Column(name = "reject_reason", length = 255)
    private String rejectReason;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "audited_at")
    private LocalDateTime auditedAt;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
