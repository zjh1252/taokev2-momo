-- 扩展 video_package_labels，承载培训宝老站专题/系列展示字段。
-- 使用 PREPARE + information_schema 做幂等 DDL，避免 Flyway DELIMITER 解析风险。

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_id'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN topic_id INT NOT NULL DEFAULT 0 COMMENT ''老站 topic_id''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'item_parent'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN item_parent INT NOT NULL DEFAULT 0 COMMENT ''老站 item_parent''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'item_index'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN item_index TINYINT NOT NULL DEFAULT 0 COMMENT ''老站 item_index 排序''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'type'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN type TINYINT NOT NULL DEFAULT 0 COMMENT ''0=通用 1=行业畅销''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'serial_index'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN serial_index TINYINT NOT NULL DEFAULT 0 COMMENT ''老站 serial_index''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'price'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN price INT NOT NULL DEFAULT 0 COMMENT ''包售价格（元）''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'company_price'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN company_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT ''企业采购价''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'disabled'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN disabled TINYINT NOT NULL DEFAULT 0 COMMENT ''1=已删除''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_name'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN topic_name VARCHAR(100) NOT NULL DEFAULT '''' COMMENT ''专题名称''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'package_code'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN package_code VARCHAR(50) NOT NULL DEFAULT '''' COMMENT ''老站 package 字段''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'descr'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN descr TEXT NULL COMMENT ''分类介绍''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'cover'
    ),
    'ALTER TABLE video_package_labels ADD COLUMN cover VARCHAR(255) NULL COMMENT ''类别封面''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND index_name = 'idx_video_package_labels_tree'
    ),
    'CREATE INDEX idx_video_package_labels_tree ON video_package_labels (disabled, type, serial_index, item_index)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND index_name = 'idx_video_package_labels_parent'
    ),
    'CREATE INDEX idx_video_package_labels_parent ON video_package_labels (item_parent, id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
