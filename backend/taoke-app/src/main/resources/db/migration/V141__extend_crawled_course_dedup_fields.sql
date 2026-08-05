-- V141: 扩展爬取课程去重目标字段
-- 支持去重目标指向正式课程或其他待审核爬取课程，并记录匹配规则、分数和检查时间。
-- 可重复执行：列/索引已存在则跳过。

SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'dedup_target_type') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN dedup_target_type VARCHAR(32) NULL COMMENT ''重复目标类型：COURSE/CRAWLED_COURSE'' AFTER dedup_course_id',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'dedup_target_id') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN dedup_target_id INT NULL COMMENT ''重复目标 ID'' AFTER dedup_target_type',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'dedup_match_type') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN dedup_match_type VARCHAR(64) NULL COMMENT ''去重匹配规则'' AFTER dedup_target_id',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'dedup_score') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN dedup_score INT NULL COMMENT ''去重匹配分数 0-100'' AFTER dedup_match_type',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'dedup_checked_at') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN dedup_checked_at DATETIME NULL COMMENT ''最近一次去重检查时间'' AFTER dedup_score',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND INDEX_NAME = 'idx_dedup_target') = 0,
        'CREATE INDEX idx_dedup_target ON crawled_courses (dedup_target_type, dedup_target_id)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND INDEX_NAME = 'idx_dedup_checked_at') = 0,
        'CREATE INDEX idx_dedup_checked_at ON crawled_courses (dedup_checked_at)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
