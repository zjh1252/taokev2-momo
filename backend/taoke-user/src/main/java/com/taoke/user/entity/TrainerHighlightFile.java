package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 专家精彩瞬间文件实体（图片/视频）
 * <p>子文件跟随父级 highlight 审核状态，自身不独立审核</p>
 *
 * @author Fangxinxin
 * @date 2026-04-11 20:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "user_trainer_highlight_files")
public class TrainerHighlightFile extends BaseEntity {

    @Column(name = "highlight_id", nullable = false)
    private Integer highlightId;

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 文件类型：1=图片, 2=视频 */
    @Column(name = "file_type", nullable = false, columnDefinition = "tinyint(2)")
    private Integer fileType;

    /** 标题 */
    @Column(name = "title", length = 200)
    private String title;

    /** 文件 URL */
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    /** 缩略图 URL */
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    /** 图片宽度 */
    @Column(name = "width")
    private Integer width;

    /** 图片高度 */
    @Column(name = "height")
    private Integer height;

    /** 视频时长（秒） */
    @Column(name = "duration")
    private Integer duration;

    /** 文件大小（字节） */
    @Column(name = "file_size")
    private Long fileSize;

    /** 排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
