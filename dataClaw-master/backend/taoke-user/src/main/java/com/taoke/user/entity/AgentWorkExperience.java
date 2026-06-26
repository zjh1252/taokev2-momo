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
 * 经纪人工作认证记录实体（按记录审核）。
 * <p>结构与 {@link TrainerWorkExperience} 完全一致，区分关联主体为
 * {@code user_agents.id}。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "agent_work_experiences")
public class AgentWorkExperience extends BaseEntity {

    /** 关联 {@code user_agents.id} */
    @Column(name = "agent_id", nullable = false)
    private Integer agentId;

    /** 单位名称 */
    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    /** 担任职务 */
    @Column(name = "position", length = 100)
    private String position;

    /** 起始日期 */
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

    /** 最近一次提交时间 */
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /** 最近一次审核时间 */
    @Column(name = "audited_at")
    private LocalDateTime auditedAt;

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
