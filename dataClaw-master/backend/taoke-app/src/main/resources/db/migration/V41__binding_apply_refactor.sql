-- ============================================================
-- V41: 绑定通知与申请流程重构相关 schema 调整
--   1. user_enterprise_agent_members 增加绑定状态相关列
--      （status / note / reject_reason / initiator_user_id / confirmed_at）
--   2. 历史 PENDING 的 INSTITUTION_EMPLOYEE / AGENT 角色申请记录置为已禁用（status=4），
--      告知用户在新流程里重新申请（由机构 / 经纪公司在用户中心审核）
-- ============================================================

-- ------------------------------------------------------------
-- 1) user_enterprise_agent_members 兼容已存在表，逐列守卫式新增
-- ------------------------------------------------------------
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_enterprise_agent_members' AND COLUMN_NAME = 'status');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_enterprise_agent_members` ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT ''绑定状态：1=ACTIVE 2=PENDING 3=UNBOUND 4=REJECTED''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_enterprise_agent_members' AND COLUMN_NAME = 'note');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_enterprise_agent_members` ADD COLUMN `note` VARCHAR(500) NULL DEFAULT NULL COMMENT ''备注''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_enterprise_agent_members' AND COLUMN_NAME = 'reject_reason');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_enterprise_agent_members` ADD COLUMN `reject_reason` VARCHAR(500) NULL DEFAULT NULL COMMENT ''拒绝理由''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_enterprise_agent_members' AND COLUMN_NAME = 'initiator_user_id');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_enterprise_agent_members` ADD COLUMN `initiator_user_id` INT NULL DEFAULT NULL COMMENT ''发起方用户 ID''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_enterprise_agent_members' AND COLUMN_NAME = 'confirmed_at');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_enterprise_agent_members` ADD COLUMN `confirmed_at` DATETIME NULL DEFAULT NULL COMMENT ''确认时间''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 历史已存在的成员记录默认视为 ACTIVE
UPDATE `user_enterprise_agent_members` SET `status` = 1 WHERE `status` IS NULL OR `status` = 0;

-- ------------------------------------------------------------
-- 2) 兜底处理历史角色申请：INSTITUTION_EMPLOYEE / AGENT 不再走平台审核
--    将 PENDING(2) 的记录改为 4（已禁用），用户需在新流程重新申请。
--    注意：保留 REJECTED(3)/ACTIVE(1) 不动。
-- ------------------------------------------------------------
UPDATE `sys_user_roles`
SET `status` = 4,
    `reject_reason` = COALESCE(`reject_reason`, '')
WHERE `role` IN ('INSTITUTION_EMPLOYEE', 'AGENT')
  AND `status` = 2;
