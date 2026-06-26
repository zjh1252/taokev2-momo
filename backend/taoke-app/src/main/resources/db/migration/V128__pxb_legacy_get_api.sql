-- 培训宝 legacy /api/get.php：视频共享映射 + 讲师关联日志
-- 可重复执行（information_schema 防御）

SET @db := DATABASE();

-- videos.pxb_supplier_id / legacy_v_type
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'pxb_supplier_id') = 0,
        'ALTER TABLE videos ADD COLUMN pxb_supplier_id INT NOT NULL DEFAULT 0 COMMENT ''培训宝课程/系列外部 ID（老站 supplier_id）'' AFTER published_at',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'legacy_v_type') = 0,
        'ALTER TABLE videos ADD COLUMN legacy_v_type TINYINT NOT NULL DEFAULT 0 COMMENT ''老站 v_type：6=培训宝共享'' AFTER pxb_supplier_id',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'videos' AND INDEX_NAME = 'idx_videos_pxb_supplier') = 0,
        'CREATE INDEX idx_videos_pxb_supplier ON videos (pxb_supplier_id, legacy_v_type)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- video_chapters.pxb_supplier_id
SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'video_chapters' AND COLUMN_NAME = 'pxb_supplier_id') = 0,
        'ALTER TABLE video_chapters ADD COLUMN pxb_supplier_id INT NOT NULL DEFAULT 0 COMMENT ''培训宝分集外部 ID'' AFTER is_preview',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'video_chapters' AND INDEX_NAME = 'idx_video_chapters_pxb_supplier') = 0,
        'CREATE INDEX idx_video_chapters_pxb_supplier ON video_chapters (video_id, pxb_supplier_id)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 培训宝讲师关联日志（老站 pxb_related_log）
CREATE TABLE IF NOT EXISTS pxb_trainer_related_logs (
    id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    trainer_uid   INT          NOT NULL COMMENT '淘课讲师 user_id（老站 uid）',
    pxb_uid       INT          NOT NULL COMMENT '培训宝用户 uid',
    pxb_username  VARCHAR(100) NOT NULL DEFAULT '',
    mobile        VARCHAR(32)  NOT NULL DEFAULT '',
    created_at    DATETIME     NOT NULL,
    KEY idx_pxb_trainer_related_trainer (trainer_uid),
    KEY idx_pxb_trainer_related_pxb (pxb_uid)
) COMMENT '培训宝 legacy：讲师关联记录';
