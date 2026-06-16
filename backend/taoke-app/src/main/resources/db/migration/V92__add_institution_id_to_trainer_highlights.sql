-- ==============================================================
-- V92: user_trainer_highlights 支持机构主体发布（institution_id）
-- ==============================================================

DROP PROCEDURE IF EXISTS v92_add_institution_id_to_highlights;

DELIMITER $$
CREATE PROCEDURE v92_add_institution_id_to_highlights()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'user_trainer_highlights' AND column_name = 'institution_id'
    ) THEN
        ALTER TABLE user_trainer_highlights
            ADD COLUMN institution_id INT NULL COMMENT '机构主体 ID（user_institutions.id）' AFTER trainer_id;
    END IF;
END$$
DELIMITER ;

CALL v92_add_institution_id_to_highlights();
DROP PROCEDURE IF EXISTS v92_add_institution_id_to_highlights;

-- trainer_id 改为可空：机构主体发布时不绑定专家
ALTER TABLE user_trainer_highlights MODIFY COLUMN trainer_id INT NULL;
