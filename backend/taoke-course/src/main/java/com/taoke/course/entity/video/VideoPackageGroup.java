package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;

import java.math.BigDecimal;

/**
 * 录播课视频包分组 — 对应 video_package_groups 表（全系列购买单元）
 *
 * @author Fangxinxin
 * @date 2026-06-10 18:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@Table(name = "video_package_groups")
public class VideoPackageGroup extends BaseEntity {

    @Column(name = "package_id", nullable = false)
    private Integer packageId;

    @Column(name = "topic_id", nullable = false)
    private Integer topicId = 0;

    @Column(name = "parent_id", nullable = false)
    private Integer parentId = 0;

    @Column(name = "name", nullable = false, length = 150)
    private String name = "";

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "company_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal companyPrice = BigDecimal.ZERO;

    @Column(name = "max_purchase_qty", nullable = false)
    private Integer maxPurchaseQty = 20;

    @Column(name = "video_count", nullable = false)
    private Integer videoCount = 0;
}
