package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 专家荣誉资质实体
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Getter
@Setter
@Entity
@Table(name = "trainer_honors")
public class TrainerHonor extends BaseEntity {

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 荣誉名称 */
    @Column(name = "honor_name", nullable = false, length = 200)
    private String honorName;

    /** 荣誉证书/图片 URL */
    @Column(name = "honor_image", length = 500)
    private String honorImage;

    /** 颁发机构 */
    @Column(name = "issuing_authority", length = 200)
    private String issuingAuthority;

    /** 获得日期 */
    @Column(name = "issued_at")
    private LocalDate issuedAt;

    /** 荣誉描述 */
    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
