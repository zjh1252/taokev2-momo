-- ==============================================================
-- V62: 课程发布表单字段调整（幂等，兼容部分执行失败后的重试）
-- ==============================================================

DROP PROCEDURE IF EXISTS v62_migrate_courses;

DELIMITER $$
CREATE PROCEDURE v62_migrate_courses()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'summary'
    ) THEN
        ALTER TABLE courses
            ADD COLUMN summary VARCHAR(500) NOT NULL DEFAULT '' COMMENT '课程简介（短文本）' AFTER intro;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'material_url'
    ) THEN
        ALTER TABLE courses
            ADD COLUMN material_url VARCHAR(500) NOT NULL DEFAULT '' COMMENT '课程资料文件 URL（doc/docx/pdf）' AFTER syllabus;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'hours_per_day'
    ) THEN
        ALTER TABLE courses
            MODIFY COLUMN hours_per_day DECIMAL(8,1) NOT NULL DEFAULT 0.0 COMMENT '每天课时（迁移为总时长前）';

        UPDATE courses
        SET hours_per_day = LEAST(ROUND(duration_days * hours_per_day, 1), 9999.9)
        WHERE duration_days > 0;

        ALTER TABLE courses
            CHANGE COLUMN hours_per_day total_hours DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT '课程总时长（小时）';
    END IF;
END$$
DELIMITER ;

CALL v62_migrate_courses();
DROP PROCEDURE IF EXISTS v62_migrate_courses;
