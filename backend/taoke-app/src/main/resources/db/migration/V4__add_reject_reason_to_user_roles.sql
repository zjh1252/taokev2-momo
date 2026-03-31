-- ============================================================
-- V4: sys_user_roles 增加驳回原因字段
-- ============================================================

ALTER TABLE `sys_user_roles`
    ADD COLUMN `reject_reason` VARCHAR(512) NULL DEFAULT NULL COMMENT '驳回原因' AFTER `approved_by`;
