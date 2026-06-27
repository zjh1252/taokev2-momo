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
 * 录播课视频包分组 — 专题头 + 系列课树（对应 video_package_groups）。
 * <p>专题头：{@code topic_id=0, parent_id=0, package_id=tk_video_topic.id}；
 * 系列课：{@code package_id=topic_id, topic_id=item.id, parent_id=item_parent}。</p>
 */
@Getter
@Setter
@Entity
@DynamicInsert
@Table(name = "video_package_groups")
public class VideoPackageGroup extends BaseEntity {

    /** 所属专题头 ID（老站 tk_video_topic.id） */
    @Column(name = "package_id", nullable = false)
    private Integer packageId;

    /** 系列节点 ID；专题头行为 0 */
    @Column(name = "topic_id", nullable = false)
    private Integer topicId = 0;

    /** 父节点 ID（老站 item_parent）；专题头行为 0 */
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

    @Column(name = "type", nullable = false, columnDefinition = "TINYINT")
    private Integer type = 0;

    @Column(name = "serial_index", nullable = false, columnDefinition = "TINYINT")
    private Integer serialIndex = 0;

    @Column(name = "item_index", nullable = false, columnDefinition = "TINYINT")
    private Integer itemIndex = 0;

    @Column(name = "package_code", nullable = false, length = 50)
    private String packageCode = "";

    @Column(name = "descr", columnDefinition = "TEXT")
    private String descr;

    @Column(name = "cover", length = 255)
    private String cover;

    /** 是否为专题头行（非系列课节点） */
    public boolean isTopicHeader() {
        return topicId != null && topicId == 0 && parentId != null && parentId == 0;
    }

    /** 培训宝 API 使用的节点 ID（系列课 = topic_id，与 labels.id 一致） */
    public int legacyNodeId() {
        return topicId != null && topicId > 0 ? topicId : (packageId != null ? packageId : 0);
    }
}
