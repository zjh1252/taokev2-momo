package com.taoke.course.entity.video;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 录播课视频包名称 — 对应 video_package_labels 表（ID 来自老站 tk_video_topic_item）
 *
 * @author Fangxinxin
 * @date 2026-06-10 14:00
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
