-- 录播课评论（对齐老站 tk_video_comment 核心字段）
CREATE TABLE video_comments (
    id          INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    video_id    INT             NOT NULL                    COMMENT '录播课 ID',
    user_id     INT             NOT NULL DEFAULT 0          COMMENT '评论用户 ID，0=匿名/游客',
    user_name   VARCHAR(100)    NOT NULL DEFAULT ''         COMMENT '展示昵称',
    content     TEXT            NOT NULL                    COMMENT '评论正文',
    rating      TINYINT(2)      NOT NULL                    COMMENT '星级 1-5',
    visible     TINYINT(1)      NOT NULL DEFAULT 1          COMMENT '是否展示：1=是 0=否',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_video_comments_video (video_id, visible, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课评论';
