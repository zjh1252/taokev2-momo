-- 老站「信得过」角标：tk_member_auth.is_xdg=1 或 isqc=1 → user_trainers.is_trusted=1
-- 依赖同实例老库 taoke；与 V68/V131 一致，auth.uid 对应迁库 user_trainers.id 或 user_id
-- 无 taoke 库时整脚本跳过（纯新库 / CI 可正常启动）
-- 可重复执行（仅补 is_trusted=0 的行）

SET @legacy_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_member_auth'
);

SET @sql := IF(@legacy_ok > 0,
'UPDATE user_trainers t
INNER JOIN taoke.tk_member_auth a
        ON (a.uid = t.id OR a.uid = t.user_id)
SET t.is_trusted = 1,
    t.updated_at = NOW()
WHERE t.status = 2
  AND t.is_trusted = 0
  AND (a.is_xdg = 1 OR a.isqc = 1)',
'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
