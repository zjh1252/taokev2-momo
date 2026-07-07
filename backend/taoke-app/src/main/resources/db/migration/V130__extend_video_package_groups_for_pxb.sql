-- 扩展 video_package_groups，承载培训宝专题/系列课树展示字段。
-- 使用 PREPARE + information_schema 做幂等 DDL，避免 Flyway DELIMITER 解析风险。

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'type'
    ),
    'ALTER TABLE video_package_groups ADD COLUMN type TINYINT NOT NULL DEFAULT 0 COMMENT ''0=通用 1=行业畅销（老站 topic_item.type）'' AFTER video_count',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'serial_index'
    ),
    'ALTER TABLE video_package_groups ADD COLUMN serial_index TINYINT NOT NULL DEFAULT 0 COMMENT ''推荐顺序（老站 serial_index）'' AFTER type',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'item_index'
    ),
    'ALTER TABLE video_package_groups ADD COLUMN item_index TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''排序（老站 item_index）'' AFTER serial_index',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'package_code'
    ),
    'ALTER TABLE video_package_groups ADD COLUMN package_code VARCHAR(50) NOT NULL DEFAULT '''' COMMENT ''老站 package 字段'' AFTER item_index',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'descr'
    ),
    'ALTER TABLE video_package_groups ADD COLUMN descr TEXT NULL COMMENT ''分类介绍'' AFTER package_code',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'cover'
    ),
    'ALTER TABLE video_package_groups ADD COLUMN cover VARCHAR(255) NULL COMMENT ''类别封面'' AFTER descr',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND index_name = 'idx_video_package_groups_tree'
    ),
    'CREATE INDEX idx_video_package_groups_tree ON video_package_groups (type, serial_index, item_index)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
