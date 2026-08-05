-- ============================================================
-- V154: 课程公开列表默认评分排序索引
-- WHERE status=2 AND type IN (...) ORDER BY score DESC, id DESC
-- ============================================================

SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'courses'
           AND INDEX_NAME = 'idx_courses_type_status_score') = 0,
        'CREATE INDEX idx_courses_type_status_score ON courses (type, status, score, id)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
