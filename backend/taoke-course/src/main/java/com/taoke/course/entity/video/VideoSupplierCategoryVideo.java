package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 供应商分类与录播课关联 — 对应 video_supplier_category_videos 表
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "video_supplier_category_videos")
public class VideoSupplierCategoryVideo extends BaseEntity {

    @Column(name = "supplier_id", nullable = false)
    private Integer supplierId;

    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
