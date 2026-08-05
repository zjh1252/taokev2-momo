-- ============================================================
-- V147: 内训课公开列表默认排序索引
-- WHERE type='INTERNAL' AND status=2 ORDER BY sort_order DESC, published_at DESC, id DESC
-- ============================================================

SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'courses'
           AND INDEX_NAME = 'idx_courses_internal_list') = 0,
        'CREATE INDEX idx_courses_internal_list ON courses (type, status, sort_order, published_at, id)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 人气排序：内训课 view_count
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'courses'
           AND INDEX_NAME = 'idx_courses_type_status_view') = 0,
        'CREATE INDEX idx_courses_type_status_view ON courses (type, status, view_count, id)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
