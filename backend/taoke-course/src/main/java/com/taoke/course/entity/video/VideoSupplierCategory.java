package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;

/**
 * 录播课供应商分类 — 对应 video_supplier_categories 表
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "video_supplier_categories")
public class VideoSupplierCategory extends BaseEntity {

    @Column(name = "supplier_id", nullable = false)
    private Integer supplierId;

    @Column(name = "parent_id", nullable = false)
    private Integer parentId = 0;

    @Column(name = "name", nullable = false, length = 150)
    private String name = "";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "total_price", precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "discount_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountRate = new BigDecimal("100");

    @Column(name = "enabled", nullable = false, columnDefinition = "TINYINT(1)")
    private Boolean enabled = true;
}
