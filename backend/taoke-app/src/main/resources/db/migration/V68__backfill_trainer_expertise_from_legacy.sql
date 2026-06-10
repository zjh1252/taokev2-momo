-- 专家擅长领域/行业/标签回填（第一部分：标量字段）
-- 关联分类行请在同库执行: python data-trans/scripts/run_trainer_fields_backfill.py
-- 依赖老库 taoke 与 v3test 同实例

UPDATE user_trainers t
INNER JOIN taoke.tk_member m ON m.id = t.id
INNER JOIN taoke.tk_member_ext e ON e.uid = m.id
SET t.title = LEFT(TRIM(e.job), 64),
    t.updated_at = NOW()
WHERE t.status = 2
  AND (t.title IS NULL OR TRIM(t.title) = '')
  AND e.job IS NOT NULL
  AND TRIM(e.job) <> '';

UPDATE user_trainers t
INNER JOIN taoke.tk_member m ON m.id = t.id
SET t.expertise_tags = LEFT(TRIM(m.goodat), 500),
    t.updated_at = NOW()
WHERE t.status = 2
  AND (t.expertise_tags IS NULL OR TRIM(t.expertise_tags) = '')
  AND m.goodat IS NOT NULL
  AND TRIM(m.goodat) <> '';
