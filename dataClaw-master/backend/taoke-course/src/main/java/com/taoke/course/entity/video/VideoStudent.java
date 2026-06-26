package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 录播课学员实体 — 对应 video_students 表
 * <p>
 * 跟踪学员的学习状态：进度、观看时长、完成情况等。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "video_students")
public class VideoStudent extends BaseEntity {

    /** 录播课ID */
    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    /** 学员用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 关联报名记录ID */
    @Column(name = "enrollment_id", nullable = false)
    private Integer enrollmentId;

    /** 上次观看的章节ID */
    @Column(name = "last_chapter_id", nullable = false)
    private Integer lastChapterId = 0;

    /** 整体进度（0~100） */
    @Column(name = "progress", nullable = false)
    private Integer progress = 0;

    /** 已完成章节数 */
    @Column(name = "completed_chapters", nullable = false)
    private Integer completedChapters = 0;

    /** 累计观看时长（秒） */
    @Column(name = "total_watch_time", nullable = false)
    private Integer totalWatchTime = 0;

    /** 首次学习时间 */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** 最近观看时间 */
    @Column(name = "last_watched_at")
    private LocalDateTime lastWatchedAt;

    /** 是否完成全部课程：0=否 1=是 */
    @Column(name = "is_completed", nullable = false, columnDefinition = "tinyint")
    private Integer isCompleted = 0;

    /** 完成时间 */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
