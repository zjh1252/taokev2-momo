-- 新增精彩瞬间文件子表（一个精彩瞬间可包含多个图片/视频）
CREATE TABLE `user_trainer_highlight_files` (
    `id`              INT           NOT NULL AUTO_INCREMENT,
    `highlight_id`    INT           NOT NULL COMMENT '关联 user_trainer_highlights.id',
    `trainer_id`      INT           NOT NULL COMMENT '关联 user_trainers.id',
    `file_type`       TINYINT(2)    NOT NULL DEFAULT 1 COMMENT '文件类型：1=图片, 2=视频',
    `title`           VARCHAR(200)  NOT NULL DEFAULT '' COMMENT '标题',
    `file_url`        VARCHAR(500)  NOT NULL COMMENT '文件 URL',
    `thumbnail_url`   VARCHAR(500)  NOT NULL DEFAULT '' COMMENT '缩略图 URL',
    `width`           INT           NOT NULL DEFAULT 0 COMMENT '图片宽度（px）',
    `height`          INT           NOT NULL DEFAULT 0 COMMENT '图片高度（px）',
    `duration`        INT           NOT NULL DEFAULT 0 COMMENT '视频时长（秒），图片为 0',
    `file_size`       BIGINT        NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
    `sort_order`      INT           NOT NULL DEFAULT 0 COMMENT '排序值',
    `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_highlight_files_highlight_sort` (`highlight_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家精彩瞬间文件表';

-- 父表新增封面图列
ALTER TABLE `user_trainer_highlights`
    ADD COLUMN `cover_image` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '封面图 URL' AFTER `description`;

-- 将已有单文件数据迁移到子表
INSERT INTO `user_trainer_highlight_files` (`highlight_id`, `trainer_id`, `file_type`, `file_url`, `thumbnail_url`, `duration`, `file_size`, `sort_order`)
SELECT `id`, `trainer_id`, `media_type`, `media_url`, `thumbnail_url`, `duration`, `file_size`, 0
FROM `user_trainer_highlights`
WHERE `media_url` != '';

-- 用 thumbnail_url 填充 cover_image
UPDATE `user_trainer_highlights` SET `cover_image` = `thumbnail_url` WHERE `thumbnail_url` != '';
