-- ============================================================
-- V65: 专家案例「最近已审核」列表查询索引
-- 修复 status=1 + ORDER BY 时全表排序导致 Out of sort memory
-- ============================================================

SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_trainer_cases'
      AND index_name = 'idx_trainer_cases_status_id'
);

SET @ddl := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_trainer_cases_status_id ON user_trainer_cases (status, id)',
    'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
