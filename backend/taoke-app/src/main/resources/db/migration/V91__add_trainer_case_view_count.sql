-- ==============================================================
-- V91: user_trainer_cases 增加 view_count 列（幂等）
-- 案例详情页访问次数，C 端每次访问 +1
-- ==============================================================

DROP PROCEDURE IF EXISTS v91_add_case_view_count;

DELIMITER $$
CREATE PROCEDURE v91_add_case_view_count()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'user_trainer_cases' AND column_name = 'view_count'
    ) THEN
        ALTER TABLE user_trainer_cases
            ADD COLUMN view_count INT NOT NULL DEFAULT 0 COMMENT '案例详情页访问次数' AFTER cover_image;
    END IF;
END$$
DELIMITER ;

CALL v91_add_case_view_count();
DROP PROCEDURE IF EXISTS v91_add_case_view_count;
