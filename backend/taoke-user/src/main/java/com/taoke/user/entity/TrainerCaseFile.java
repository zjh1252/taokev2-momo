package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;

/**
 * 专家案例文件实体（图片/视频）
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:30
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "user_trainer_case_files")
public class TrainerCaseFile extends BaseEntity {

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    @Column(name = "case_id", nullable = false)
    private Integer caseId;

    /** 文件类型：1=图片, 2=视频 */
    @Column(name = "file_type", nullable = false, columnDefinition = "tinyint(2)")
    private Integer fileType;

    /** 标题 */
    @Column(name = "title", length = 200)
    private String title;

    /** 描述 */
    @Column(name = "description", length = 500)
    private String description;

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

    /** 是否系统自动萃取 */
    @Column(name = "auto_extracted", nullable = false, columnDefinition = "tinyint(1)")
    private Boolean autoExtracted;

    /** 排序值 */
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
