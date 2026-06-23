package com.taoke.course.entity.video;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 录播课视频包/专题节点 — 对应 video_package_labels（老站 tk_video_topic_item）。
 */
@Getter
@Setter
@Entity
@Table(name = "video_package_labels")
public class VideoPackageLabel {

    @Id
    private Integer id;

    @Column(name = "topic_id", nullable = false)
    private Integer topicId = 0;

    @Column(name = "name", nullable = false, length = 150)
    private String name = "";

    @Column(name = "item_parent", nullable = false)
    private Integer itemParent = 0;

    @Column(name = "item_index", nullable = false, columnDefinition = "TINYINT")
    private Integer itemIndex = 0;

    @Column(name = "type", nullable = false, columnDefinition = "TINYINT")
    private Integer type = 0;

    @Column(name = "serial_index", nullable = false, columnDefinition = "TINYINT")
    private Integer serialIndex = 0;

    @Column(name = "price", nullable = false)
    private Integer price = 0;

    @Column(name = "company_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal companyPrice = BigDecimal.ZERO;

    @Column(name = "disabled", nullable = false, columnDefinition = "TINYINT")
    private Integer disabled = 0;

    @Column(name = "topic_name", nullable = false, length = 100)
    private String topicName = "";

    @Column(name = "package_code", nullable = false, length = 50)
    private String packageCode = "";

    @Column(name = "descr", columnDefinition = "TEXT")
    private String descr;

    @Column(name = "cover", length = 255)
    private String cover;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
