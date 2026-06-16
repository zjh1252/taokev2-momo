package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 录播课评论 — 对应 video_comments 表
 *
 * @author Fangxinxin
 * @date 2026-06-10 16:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "video_comments")
public class VideoComment extends BaseEntity {

    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    @Column(name = "user_id", nullable = false)
    private Integer userId = 0;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName = "";

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "rating", nullable = false, columnDefinition = "TINYINT(2)")
    private Integer rating;

    /** 审核状态：0=待审核 1=已通过 2=已驳回 */
    @Column(name = "audit_status", nullable = false, columnDefinition = "TINYINT(2)")
    private Integer auditStatus = 1;

    @Column(name = "reject_reason", nullable = false, length = 500)
    private String rejectReason = "";

    @Column(name = "visible", nullable = false, columnDefinition = "TINYINT(1)")
    private Boolean visible = true;
}
