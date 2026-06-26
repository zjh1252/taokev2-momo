-- ============================================================
-- V67: 爬虫任务进度字段
--   支持任务列表运行中实时展示处理数量和当前阶段
-- ============================================================

SET @add_processed_count = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE crawl_jobs ADD COLUMN processed_count INT NOT NULL DEFAULT 0 COMMENT ''已处理条数'' AFTER total_count',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'crawl_jobs'
      AND column_name = 'processed_count'
);
PREPARE stmt FROM @add_processed_count;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_progress_message = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE crawl_jobs ADD COLUMN progress_message VARCHAR(500) NULL COMMENT ''当前进度说明'' AFTER error_message',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'crawl_jobs'
      AND column_name = 'progress_message'
);
PREPARE stmt FROM @add_progress_message;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
