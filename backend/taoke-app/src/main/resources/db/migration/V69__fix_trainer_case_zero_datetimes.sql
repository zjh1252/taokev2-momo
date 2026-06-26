-- 修复迁移残留的零日期，避免 JPA/Jackson 解析 LocalDateTime 失败导致 /trainers/{id}/cases 500
UPDATE user_trainer_cases
SET created_at = COALESCE(updated_at, CONCAT(training_date, ' 00:00:00'), NOW())
WHERE created_at IS NULL
   OR created_at < '1971-01-01';

UPDATE user_trainer_case_files
SET created_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL
   OR created_at < '1971-01-01';
