package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 录播课章节学习进度实体 — 对应 video_chapter_progress 表
 * <p>
 * 按章节粒度记录学员的观看进度、时长等。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:00
 */
@Getter
@Setter
@Entity
@Table(name = "video_chapter_progress")
public class VideoChapterProgress extends BaseEntity {

    /** 录播课ID */
    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    /** 章节ID */
    @Column(name = "chapter_id", nullable = false)
    private Integer chapterId;

    /** 学员用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 已观看时长（秒） */
    @Column(name = "watch_duration", nullable = false)
    private Integer watchDuration = 0;

    /** 章节总时长（秒） */
    @Column(name = "chapter_duration", nullable = false)
    private Integer chapterDuration = 0;

    /** 章节进度（0~100） */
    @Column(name = "progress", nullable = false)
    private Integer progress = 0;

    /** 首次观看时间 */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** 最近观看时间 */
    @Column(name = "last_watched_at")
    private LocalDateTime lastWatchedAt;

    /** 是否看完：0=否 1=是 */
    @Column(name = "completed", nullable = false, columnDefinition = "tinyint")
    private Boolean completed = false;

    /** 看完时间 */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
