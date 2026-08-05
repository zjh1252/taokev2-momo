SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'seo_description') = 0,
        'ALTER TABLE courses ADD COLUMN seo_description VARCHAR(255) NULL COMMENT ''SEO 自定义描述'' AFTER keywords',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'seo_description') = 0,
        'ALTER TABLE videos ADD COLUMN seo_description VARCHAR(255) NULL COMMENT ''SEO 自定义描述'' AFTER keywords',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_trainers' AND COLUMN_NAME = 'seo_description') = 0,
        'ALTER TABLE user_trainers ADD COLUMN seo_description VARCHAR(255) NULL COMMENT ''SEO 自定义描述'' AFTER one_line_intro',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_institutions' AND COLUMN_NAME = 'seo_description') = 0,
        'ALTER TABLE user_institutions ADD COLUMN seo_description VARCHAR(255) NULL COMMENT ''SEO 自定义描述'' AFTER bio',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
