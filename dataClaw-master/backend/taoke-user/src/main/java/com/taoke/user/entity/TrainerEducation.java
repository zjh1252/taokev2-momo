package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 专家教育经历实体
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Getter
@Setter
@Entity
@Table(name = "trainer_educations")
public class TrainerEducation extends BaseEntity {

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 持证人姓名（学历文凭上的姓名） */
    @Column(name = "holder_name", length = 64)
    private String holderName;

    /** 学校名称 */
    @Column(name = "school_name", nullable = false, length = 200)
    private String schoolName;

    /** 所学专业 */
    @Column(name = "major", length = 100)
    private String major;

    /** 学历/学位 */
    @Column(name = "degree", length = 50)
    private String degree;

    /** 入学日期 */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** 毕业日期（NULL 表示在读） */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** 是否毕业：0=否，1=是 */
    @Column(name = "is_graduated", nullable = false, columnDefinition = "tinyint")
    private Integer isGraduated = 1;

    /** 证明文件 URL（学历证书照片） */
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
