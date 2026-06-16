-- ==============================================================
-- V25: 录播课章节学习进度表
-- ==============================================================

CREATE TABLE video_chapter_progress (
    id                INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    video_id          INT             NOT NULL                    COMMENT '录播课ID',
    chapter_id        INT             NOT NULL                    COMMENT '章节ID',
    user_id           INT             NOT NULL                    COMMENT '学员用户ID',
    watch_duration    INT             NOT NULL DEFAULT 0          COMMENT '已观看时长（秒）',
    chapter_duration  INT             NOT NULL DEFAULT 0          COMMENT '章节总时长（秒）',
    progress          INT             NOT NULL DEFAULT 0          COMMENT '章节进度（0~100）',
    started_at        DATETIME                                    COMMENT '首次观看时间',
    last_watched_at   DATETIME                                    COMMENT '最近观看时间',
    completed         TINYINT(1)      NOT NULL DEFAULT 0          COMMENT '是否看完：0=否 1=是',
    completed_at      DATETIME                                    COMMENT '看完时间',
    created_at        DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at        DATETIME        NOT NULL                    COMMENT '更新时间',
    UNIQUE INDEX idx_chapter_user (chapter_id, user_id),
    INDEX idx_video_user (video_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课章节学习进度表';
