-- 专家精彩瞬间表
CREATE TABLE `user_trainer_highlights` (
    `id`              INT           NOT NULL AUTO_INCREMENT,
    `trainer_id`      INT           NOT NULL COMMENT '关联 user_trainers.id',
    `media_type`      TINYINT(2)    NOT NULL DEFAULT 1 COMMENT '媒体类型：1=图片, 2=视频',
    `title`           VARCHAR(200)  NOT NULL DEFAULT '' COMMENT '标题',
    `description`     VARCHAR(500)  NOT NULL DEFAULT '' COMMENT '描述',
    `media_url`       VARCHAR(500)  NOT NULL COMMENT '图片/视频 URL',
    `thumbnail_url`   VARCHAR(500)  NOT NULL DEFAULT '' COMMENT '缩略图 URL',
    `duration`        INT           NOT NULL DEFAULT 0 COMMENT '视频时长（秒），图片为 0',
    `file_size`       BIGINT        NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
    `sort_order`      INT           NOT NULL DEFAULT 0 COMMENT '排序值，值越大越靠前',
    `status`          TINYINT(2)    NOT NULL DEFAULT 0 COMMENT '审核状态：0=待审核, 1=通过, 2=驳回',
    `reject_reason`   VARCHAR(500)  NOT NULL DEFAULT '' COMMENT '驳回原因',
    `reviewer_id`     INT           NULL COMMENT '审核人 ID',
    `reviewed_at`     DATETIME      NULL COMMENT '审核时间',
    `view_count`      INT           NOT NULL DEFAULT 0 COMMENT '浏览/播放次数',
    `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_trainer_highlights_trainer_id` (`trainer_id`),
    KEY `idx_trainer_highlights_status` (`status`),
    KEY `idx_trainer_highlights_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家精彩瞬间表';
