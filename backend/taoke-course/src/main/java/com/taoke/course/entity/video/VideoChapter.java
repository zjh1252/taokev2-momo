package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 录播课章节实体 — 对应 video_chapters 表
 * <p>
 * 章节是录播课的最小播放单元，可属于某个系列，也可独立存在。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "video_chapters")
public class VideoChapter extends BaseEntity {

    /** 所属录播课ID */
    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    /** 所属系列ID，0=不属于任何系列 */
    @Column(name = "series_id", nullable = false)
    private Integer seriesId = 0;

    /** 章节标题 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 章节描述 */
    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** 视频地址 */
    @Column(name = "video_url", length = 500)
    private String videoUrl;

    /** 章节封面URL */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 时长（秒） */
    @Column(name = "duration", nullable = false)
    private Integer duration = 0;

    /** 文件大小（字节） */
    @Column(name = "file_size", nullable = false)
    private Long fileSize = 0L;

    /** 排序 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 是否可免费预览：0=否 1=是 */
    @Column(name = "is_preview", nullable = false, columnDefinition = "tinyint")
    private Integer isPreview = 0;

    /** 培训宝分集外部 ID（老站 series supplier_id） */
    @Column(name = "pxb_supplier_id", nullable = false)
    private Integer pxbSupplierId = 0;
}
