package com.taoke.course.entity.video;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 录播课系列课/专题节点名称索引 — 对应 video_package_labels（V86）。
 * <p>仅保存 {@code tk_video_topic_item.id → item_name}，供 relations 快速解析展示名；
 * 树形与 PXB 字段见 {@link VideoPackageGroup}。</p>
 */
@Getter
@Setter
@Entity
@Table(name = "video_package_labels")
public class VideoPackageLabel {

    @Id
    private Integer id;

    @Column(name = "name", nullable = false, length = 150)
    private String name = "";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
