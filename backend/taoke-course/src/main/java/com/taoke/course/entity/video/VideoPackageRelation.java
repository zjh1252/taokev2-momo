package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;

/**
 * 录播课所属视频包关系 — 对应 video_package_relations 表
 *
 * @author Fangxinxin
 * @date 2026-06-10 14:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@Table(name = "video_package_relations")
public class VideoPackageRelation extends BaseEntity {

    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    @Column(name = "package_id", nullable = false)
    private Integer packageId;

    @Column(name = "topic_id", nullable = false)
    private Integer topicId = 0;

    @Column(name = "parent_id", nullable = false)
    private Integer parentId = 0;

    @Column(name = "is_primary", nullable = false, columnDefinition = "TINYINT(1)")
    private Boolean primary = false;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
