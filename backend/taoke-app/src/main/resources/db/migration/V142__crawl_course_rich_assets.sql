-- V142: Review-only rich asset fields for crawled courses.
-- Scope: crawled_courses staging table only. Official course schema is unchanged.

SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'syllabus_plain_text') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN syllabus_plain_text LONGTEXT NULL COMMENT ''Crawler outline plain text for admin review'' AFTER syllabus',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'syllabus_html') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN syllabus_html LONGTEXT NULL COMMENT ''Crawler sanitized outline HTML for admin review'' AFTER syllabus_plain_text',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'syllabus_images_json') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN syllabus_images_json JSON NULL COMMENT ''Crawler outline image assets [{url,label,type}]'' AFTER syllabus_html',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'syllabus_content_type') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN syllabus_content_type VARCHAR(16) NOT NULL DEFAULT ''TEXT'' COMMENT ''Outline content type: TEXT/IMAGE/MIXED'' AFTER syllabus_images_json',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'site_photos_plain_text') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN site_photos_plain_text LONGTEXT NULL COMMENT ''Crawler site photos text for admin review'' AFTER syllabus_content_type',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'site_photos_html') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN site_photos_html LONGTEXT NULL COMMENT ''Crawler site photos HTML for admin review'' AFTER site_photos_plain_text',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'site_photos_images_json') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN site_photos_images_json JSON NULL COMMENT ''Crawler site photo image assets [{url,label,type}]'' AFTER site_photos_html',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'site_photos_content_type') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN site_photos_content_type VARCHAR(16) NOT NULL DEFAULT ''TEXT'' COMMENT ''Site photos content type: TEXT/IMAGE/MIXED'' AFTER site_photos_images_json',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'honor_certificates_plain_text') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN honor_certificates_plain_text LONGTEXT NULL COMMENT ''Crawler honor certificate text for admin review'' AFTER site_photos_content_type',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'honor_certificates_html') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN honor_certificates_html LONGTEXT NULL COMMENT ''Crawler honor certificate HTML for admin review'' AFTER honor_certificates_plain_text',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'honor_certificates_images_json') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN honor_certificates_images_json JSON NULL COMMENT ''Crawler honor certificate image assets [{url,label,type}]'' AFTER honor_certificates_html',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'crawled_courses' AND COLUMN_NAME = 'honor_certificates_content_type') = 0,
        'ALTER TABLE crawled_courses ADD COLUMN honor_certificates_content_type VARCHAR(16) NOT NULL DEFAULT ''TEXT'' COMMENT ''Honor certificates content type: TEXT/IMAGE/MIXED'' AFTER honor_certificates_images_json',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
