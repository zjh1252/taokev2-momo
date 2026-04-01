package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 专家-擅长行业关联实体
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:55
 */
@Getter
@Setter
@Entity
@Table(name = "trainer_industry_categories")
public class TrainerIndustryCategory extends BaseEntity {

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 关联 sys_categories.id（type = TRAINER_INDUSTRY） */
    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
