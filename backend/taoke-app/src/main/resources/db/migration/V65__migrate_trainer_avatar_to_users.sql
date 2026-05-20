-- V65：头像字段统一到 sys_users.avatar_url
-- ----------------------------------------------------------------------------
-- 旧版本 user_trainers.avatar 与 sys_users.avatar_url 并存，导致前端读取来源不一致、
-- 上传后部分页面图裂。统一改为：所有用户头像存在 sys_users.avatar_url，专家表的 avatar
-- 字段不再写入；本脚本把 user_trainers.avatar 中的现有值迁回 sys_users.avatar_url。
--
-- 迁移规则：仅当 sys_users.avatar_url 为空（NULL 或 ''）且 user_trainers.avatar 非空时
-- 才回填，避免覆盖用户在通用资料中已上传的头像。
--
-- 安全性：可重复执行；user_trainers.avatar 字段暂时保留（后续单独迁移再 DROP）。

UPDATE sys_users u
JOIN user_trainers t ON t.user_id = u.id
SET u.avatar_url = t.avatar
WHERE (u.avatar_url IS NULL OR u.avatar_url = '')
  AND t.avatar IS NOT NULL
  AND t.avatar <> '';
