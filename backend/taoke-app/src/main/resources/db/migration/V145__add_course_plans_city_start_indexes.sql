-- ============================================================
-- V145: 城市频道/公开课列表按城市+开课时间过滤索引
-- 修复 course_plans 仅有 course_id 索引时，city_id / start_time 过滤全表扫描
-- ============================================================

SET @db := DATABASE();

-- 城市频道：WHERE city_id IN (...) AND start_time >= now
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_plans'
           AND INDEX_NAME = 'idx_course_plans_city_start') = 0,
        'CREATE INDEX idx_course_plans_city_start ON course_plans (city_id, start_time)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 开课时间排序子查询：按 course_id 聚合 min/max(start_time)
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_plans'
           AND INDEX_NAME = 'idx_course_plans_course_start') = 0,
        'CREATE INDEX idx_course_plans_course_start ON course_plans (course_id, start_time)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 省份维度过滤（公开课列表省筛）
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'course_plans'
           AND INDEX_NAME = 'idx_course_plans_province_start') = 0,
        'CREATE INDEX idx_course_plans_province_start ON course_plans (province_id, start_time)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
