-- ============================================================
-- V146: 城市频道机构/专家列表按城市筛选索引
-- 所有城市子频道 /city/{pinyin}/institutions、trainers 共用
-- ============================================================

SET @db := DATABASE();

-- 机构公开列表：status + eligible + city_id + created_at（newly_joined）
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_institutions'
           AND INDEX_NAME = 'idx_user_institutions_city_list') = 0,
        'CREATE INDEX idx_user_institutions_city_list ON user_institutions (status, public_list_eligible, city_id, created_at)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 专家公开列表：status + city_id + created_at（城市频道 newly_joined）
-- V7 已有 (province_id, city_id)，补 status 前缀便于公开列表
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_trainers'
           AND INDEX_NAME = 'idx_user_trainers_city_list') = 0,
        'CREATE INDEX idx_user_trainers_city_list ON user_trainers (status, city_id, created_at)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
