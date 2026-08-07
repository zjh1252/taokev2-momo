-- 老站迁移账号标记（布尔列禁止 is_ 前缀）
ALTER TABLE sys_users
    ADD COLUMN old_user TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否老站迁移账号' AFTER user_source;

UPDATE sys_users SET old_user = 1 WHERE uc_uid IS NOT NULL;
