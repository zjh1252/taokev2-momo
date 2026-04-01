package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 专家培训领域分类关联实体
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Getter
@Setter
@Entity
@Table(name = "trainer_categories")
public class TrainerCategory extends BaseEntity {

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 培训领域分类 ID（关联全局分类表） */
    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
