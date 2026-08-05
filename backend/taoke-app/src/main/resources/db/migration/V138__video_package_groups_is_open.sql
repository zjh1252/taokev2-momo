-- 专题头 is_open，对齐老站 tk_video_topic.is_open。
-- 原 V131 与专家资质回填版本冲突，改号至 V138。

SET @sql := IF(
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'is_open'
    ),
    'ALTER TABLE video_package_groups ADD COLUMN is_open INT NOT NULL DEFAULT 1 COMMENT ''专题头是否启用（老站 tk_video_topic.is_open）'' AFTER cover',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
