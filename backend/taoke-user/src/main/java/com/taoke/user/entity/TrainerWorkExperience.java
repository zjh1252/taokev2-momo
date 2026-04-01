package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

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

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
