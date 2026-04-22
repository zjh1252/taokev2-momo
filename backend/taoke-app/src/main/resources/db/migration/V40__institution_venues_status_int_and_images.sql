-- ============================================================
-- V40: 修复 institution_venues
--   1. status 列由 TINYINT 改为 INT，与 JPA 实体 Integer 对齐
--   2. 新增 images JSON 列，用于存储多张场地图片 URL 列表
-- ============================================================

ALTER TABLE `institution_venues`
    MODIFY COLUMN `status` INT NOT NULL DEFAULT 1 COMMENT '状态：1=启用，0=停用';

-- 守卫式新增 images 列（JSON 类型）
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'institution_venues' AND COLUMN_NAME = 'images');
SET @s := IF(@c = 0,
    'ALTER TABLE `institution_venues` ADD COLUMN `images` JSON NULL DEFAULT NULL COMMENT ''场地图片 URL 列表（JSON 数组）''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
