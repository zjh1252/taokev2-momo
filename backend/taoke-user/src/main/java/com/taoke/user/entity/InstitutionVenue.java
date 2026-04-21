package com.taoke.user.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 培训机构场地。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
@Data
@Entity
@Table(name = "institution_venues")
public class InstitutionVenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "institution_id", nullable = false)
    private Integer institutionId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "city_id")
    private Integer cityId;

    @Column(name = "district_id")
    private Integer districtId;

    @Column(length = 500)
    private String address;

    private Integer capacity;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    @Column(length = 2000)
    private String description;

    /** 1=启用 0=停用 */
    @Column(nullable = false)
    private Integer status;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
