-- ------------------------------------------------------------
-- V50: sys_users 新增登录账号 username 列
-- ------------------------------------------------------------
-- 支持账号+密码注册/登录通道（与手机号+验证码通道并列）
--
-- 1. 新增 username 列（VARCHAR(32)，可空，唯一索引）
-- 2. phone 放宽为可空（允许纯账号注册、未绑定手机号的用户）
-- ------------------------------------------------------------

ALTER TABLE sys_users
    ADD COLUMN username VARCHAR(32) NULL COMMENT '登录账号（字母/数字/下划线，4-32 位）' AFTER id,
    ADD UNIQUE KEY uk_users_username (username);

ALTER TABLE sys_users
    MODIFY COLUMN phone VARCHAR(20) NULL COMMENT '手机号（与 username 二选一，作为登录凭据）';
