package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

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

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
