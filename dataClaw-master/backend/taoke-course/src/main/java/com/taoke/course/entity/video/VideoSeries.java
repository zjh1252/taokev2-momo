package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 录播课系列实体 — 对应 video_series 表
 * <p>
 * 系列是录播课内的分组概念，如"基础篇"、"进阶篇"等。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "video_series")
public class VideoSeries extends BaseEntity {

    /** 所属录播课ID */
    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    /** 系列标题 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 系列描述 */
    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** 系列封面URL */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 排序 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
