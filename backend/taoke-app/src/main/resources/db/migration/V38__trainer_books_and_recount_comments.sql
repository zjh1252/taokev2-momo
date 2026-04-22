-- 专家详情页迭代：新增「著作」表 + 修复 评论计数 老数据
-- 注意：本脚本设计为可重复安全执行（IF NOT EXISTS / INFORMATION_SCHEMA 守卫）

-- ============================================================
-- 1. 专家著作表（无审核流程，专家本人可直接增删改）
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_trainer_books` (
    `id`           INT           NOT NULL AUTO_INCREMENT,
    `trainer_id`   INT           NOT NULL                                COMMENT '关联 user_trainers.id',
    `title`        VARCHAR(200)  NOT NULL                                COMMENT '书名',
    `cover_url`    VARCHAR(500)  NULL                                    COMMENT '封面图 URL',
    `publisher`    VARCHAR(200)  NULL                                    COMMENT '出版社',
    `publish_date` DATE          NULL                                    COMMENT '出版日期',
    `description`  VARCHAR(1000) NULL                                    COMMENT '简介',
    `buy_url`      VARCHAR(500)  NULL                                    COMMENT '购买链接',
    `sort_order`   INT           NOT NULL DEFAULT 0                      COMMENT '排序值，越大越靠前',
    `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_trainer_books_trainer_id` (`trainer_id`),
    KEY `idx_trainer_books_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家著作表';

-- ============================================================
-- 2. 兼容老库：若 user_institutions.comment_count 列不存在则补建
--    （V20 中相关 ALTER 被注释掉，老库可能未创建该列）
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_institutions'
      AND COLUMN_NAME = 'comment_count'
);
SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE `user_institutions` ADD COLUMN `comment_count` INT NOT NULL DEFAULT 0 COMMENT ''评价数量''',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. 修复 user_trainers / user_institutions 的累计评论数老数据
--    按 training_reviews 实际已通过条数（status=1）重算
--    review_scope=TRAINER     => user_trainers.comment_count
--    review_scope=INSTITUTION => user_institutions.comment_count
--    （courses 表暂未维护 comment_count 列，跳过）
-- ============================================================

-- 3.1 先把所有专家清零，再用统计值覆盖
UPDATE `user_trainers` SET `comment_count` = 0;

UPDATE `user_trainers` t
JOIN (
    SELECT trainer_user_id, COUNT(*) AS cnt
    FROM `training_reviews`
    WHERE review_scope = 'TRAINER'
      AND status = 1
      AND trainer_user_id IS NOT NULL
    GROUP BY trainer_user_id
) r ON r.trainer_user_id = t.user_id
SET t.comment_count = r.cnt;

-- 3.2 机构同理
UPDATE `user_institutions` SET `comment_count` = 0;

UPDATE `user_institutions` i
JOIN (
    SELECT institution_id, COUNT(*) AS cnt
    FROM `training_reviews`
    WHERE review_scope = 'INSTITUTION'
      AND status = 1
      AND institution_id IS NOT NULL
    GROUP BY institution_id
) r ON r.institution_id = i.id
SET i.comment_count = r.cnt;
