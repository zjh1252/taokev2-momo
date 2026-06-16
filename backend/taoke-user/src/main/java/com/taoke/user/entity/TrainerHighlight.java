package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;

/**
 * 专家精彩瞬间实体
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "user_trainer_highlights")
public class TrainerHighlight extends BaseEntity {

    @Column(name = "trainer_id")
    private Integer trainerId;

    /** 机构主体 ID（机构自己发布精彩瞬间时使用） */
    @Column(name = "institution_id")
    private Integer institutionId;

    /** 媒体类型：1=图片, 2=视频 */
    @Column(name = "media_type", nullable = false, columnDefinition = "tinyint(2)")
    private Integer mediaType;

    /** 标题 */
    @Column(name = "title", length = 200)
    private String title;

    /** 描述 */
    @Column(name = "description", length = 500)
    private String description;

    /** 封面图 URL */
    @Column(name = "cover_image", length = 500)
    private String coverImage;

    /** 图片/视频 URL（历史兼容，新数据存入 highlight_files 子表） */
    @Column(name = "media_url", nullable = false, length = 500)
    private String mediaUrl;

    /** 缩略图 URL */
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    /** 视频时长（秒），图片为 0 */
    @Column(name = "duration", nullable = false)
    private Integer duration;

    /** 文件大小（字节） */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /** 排序值，值越大越靠前 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    /** 审核状态：0=待审核, 1=通过, 2=驳回 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status;

    /** 驳回原因 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 审核人 ID */
    @Column(name = "reviewer_id")
    private Integer reviewerId;

    /** 审核时间 */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /** 浏览/播放次数 */
    @Column(name = "view_count", nullable = false)
    private Integer viewCount;
}
