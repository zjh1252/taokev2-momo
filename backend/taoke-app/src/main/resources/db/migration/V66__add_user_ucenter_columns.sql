-- ------------------------------------------------------------
-- V66: sys_users 接入 UCenter 账号中心所需列
-- ------------------------------------------------------------
-- 新淘课网登录/注册/改密接入老淘课网 UCenter（appid=2）账号系统。
--
-- 1. uc_uid     —— 关联 UCenter 用户 ID（即老库 tk_member.cdbid），唯一。
--                  新站注册时在 UCenter 建号后回写；老用户首次登录懒补建时回写。
-- 2. user_source —— 账号来源：1=新站注册（默认），2=老站迁移（懒补建）。
-- ------------------------------------------------------------

ALTER TABLE sys_users
    ADD COLUMN uc_uid      INT     NULL     DEFAULT NULL COMMENT 'UCenter 用户 ID（关联账号中心，老库 cdbid）' AFTER id,
    ADD COLUMN user_source TINYINT NOT NULL DEFAULT 1    COMMENT '账号来源：1=新站注册，2=老站迁移',
    ADD UNIQUE KEY uk_users_uc_uid (uc_uid);
