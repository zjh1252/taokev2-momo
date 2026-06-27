-- 培训宝「发布需求」embed：demands 表扩展字段
-- 可重复执行（information_schema 防御）

SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'demands' AND COLUMN_NAME = 'company_name') = 0,
        'ALTER TABLE demands ADD COLUMN company_name VARCHAR(200) NULL COMMENT ''公司名称'' AFTER contact_phone',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'demands' AND COLUMN_NAME = 'contact_email') = 0,
        'ALTER TABLE demands ADD COLUMN contact_email VARCHAR(100) NULL COMMENT ''联系邮箱'' AFTER company_name',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'demands' AND COLUMN_NAME = 'company_tel') = 0,
        'ALTER TABLE demands ADD COLUMN company_tel VARCHAR(30) NULL COMMENT ''公司电话'' AFTER contact_email',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'demands' AND COLUMN_NAME = 'expertise_category_id') = 0,
        'ALTER TABLE demands ADD COLUMN expertise_category_id INT NULL COMMENT ''擅长领域一级分类 ID'' AFTER company_tel',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'demands' AND COLUMN_NAME = 'expected_proposal_count') = 0,
        'ALTER TABLE demands ADD COLUMN expected_proposal_count INT NULL COMMENT ''期望方案数（内训）'' AFTER expertise_category_id',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'demands' AND COLUMN_NAME = 'source_trainer_id') = 0,
        'ALTER TABLE demands ADD COLUMN source_trainer_id INT NULL COMMENT ''指定讲师 ID'' AFTER expected_proposal_count',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'demands' AND COLUMN_NAME = 'course_kind') = 0,
        'ALTER TABLE demands ADD COLUMN course_kind VARCHAR(20) NULL COMMENT ''课程种类：OPEN/INTERNAL'' AFTER source_trainer_id',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
