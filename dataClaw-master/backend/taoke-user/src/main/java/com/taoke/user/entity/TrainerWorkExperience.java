package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 专家工作经历实体
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Getter
@Setter
@Entity
@Table(name = "trainer_work_experiences")
public class TrainerWorkExperience extends BaseEntity {

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 单位名称 */
    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    /** 职务 */
    @Column(name = "position", length = 100)
    private String position;

    /** 开始日期 */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** 结束日期（NULL 表示至今） */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** 工作描述 */
    @Column(name = "job_description", columnDefinition = "text")
    private String jobDescription;

    /** 证明文件 URL（劳动合同/名片/工牌等） */
    @Column(name = "proof_file", length = 500)
    private String proofFile;

    /** 审核状态：1=待审核 2=已通过 3=已驳回 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 1;

    /** 驳回原因 */
    @Column(name = "reject_reason", length = 255)
    private String rejectReason;

    /** 最近一次审核时间 */
    @Column(name = "audited_at")
    private LocalDateTime auditedAt;

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
