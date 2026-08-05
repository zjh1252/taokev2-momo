-- 专家擅长领域/行业/标签回填（第一部分：标量字段）
-- 关联分类行请在同库执行: python data-trans/scripts/run_trainer_fields_backfill.py
-- 依赖老库 taoke 与 v3test 同实例

SET @legacy_member_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_member'
);
SET @legacy_member_ext_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_member_ext'
);

SET @sql := IF(@legacy_member_ok > 0 AND @legacy_member_ext_ok > 0,
'UPDATE user_trainers t
INNER JOIN taoke.tk_member m ON m.id = t.id
INNER JOIN taoke.tk_member_ext e ON e.uid = m.id
SET t.title = LEFT(TRIM(e.job), 64),
    t.updated_at = NOW()
WHERE t.status = 2
  AND (t.title IS NULL OR TRIM(t.title) = '''')
  AND e.job IS NOT NULL
  AND TRIM(e.job) <> ''''',
'SELECT 1 AS flyway_v68_skip_title_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@legacy_member_ok > 0,
'UPDATE user_trainers t
INNER JOIN taoke.tk_member m ON m.id = t.id
SET t.expertise_tags = LEFT(TRIM(m.goodat), 500),
    t.updated_at = NOW()
WHERE t.status = 2
  AND (t.expertise_tags IS NULL OR TRIM(t.expertise_tags) = '''')
  AND m.goodat IS NOT NULL
  AND TRIM(m.goodat) <> ''''',
'SELECT 1 AS flyway_v68_skip_tags_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
