-- 再次确保 video_package_labels 具备培训宝展示列。
-- 用于兼容部分环境 V124 已记录但 DDL 未完整落库的情况。

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_id'),
    'ALTER TABLE video_package_labels ADD COLUMN topic_id INT NOT NULL DEFAULT 0 COMMENT ''老站 topic_id''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'item_parent'),
    'ALTER TABLE video_package_labels ADD COLUMN item_parent INT NOT NULL DEFAULT 0 COMMENT ''老站 item_parent''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'item_index'),
    'ALTER TABLE video_package_labels ADD COLUMN item_index TINYINT NOT NULL DEFAULT 0 COMMENT ''老站 item_index''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'type'),
    'ALTER TABLE video_package_labels ADD COLUMN type TINYINT NOT NULL DEFAULT 0 COMMENT ''0=通用 1=行业畅销''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'serial_index'),
    'ALTER TABLE video_package_labels ADD COLUMN serial_index TINYINT NOT NULL DEFAULT 0 COMMENT ''老站 serial_index''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'price'),
    'ALTER TABLE video_package_labels ADD COLUMN price INT NOT NULL DEFAULT 0 COMMENT ''包售价格（元）''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'company_price'),
    'ALTER TABLE video_package_labels ADD COLUMN company_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT ''企业采购价''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'disabled'),
    'ALTER TABLE video_package_labels ADD COLUMN disabled TINYINT NOT NULL DEFAULT 0 COMMENT ''1=已删除''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_name'),
    'ALTER TABLE video_package_labels ADD COLUMN topic_name VARCHAR(100) NOT NULL DEFAULT '''' COMMENT ''专题名称''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'package_code'),
    'ALTER TABLE video_package_labels ADD COLUMN package_code VARCHAR(50) NOT NULL DEFAULT '''' COMMENT ''老站 package 字段''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'descr'),
    'ALTER TABLE video_package_labels ADD COLUMN descr TEXT NULL COMMENT ''分类介绍''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'cover'),
    'ALTER TABLE video_package_labels ADD COLUMN cover VARCHAR(255) NULL COMMENT ''类别封面''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_name'),
    'UPDATE video_package_labels SET topic_id = id, topic_name = name WHERE topic_id = 0 OR topic_name = ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
