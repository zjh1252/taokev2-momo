-- ============================================================
-- V3: 角色命名重构
--
-- 1. user_enterprises → user_enterprise_buyers（对齐 ENTERPRISE_BUYER 角色编码）
-- 2. organization → institution（机构相关表统一改名，避免与通用组织表混淆）
-- 3. 权限节点中 organization 模块改为 institution
-- ============================================================

-- ------------------------------------------------------------
-- Part 1: 表重命名（5 张）
-- ------------------------------------------------------------

RENAME TABLE `user_enterprises` TO `user_enterprise_buyers`;
RENAME TABLE `user_organizations` TO `user_institutions`;
RENAME TABLE `user_org_employees` TO `user_institution_employees`;
RENAME TABLE `user_org_trainer_bindings` TO `user_institution_trainer_bindings`;
RENAME TABLE `user_org_employee_bindings` TO `user_institution_employee_bindings`;

-- ------------------------------------------------------------
-- Part 2: 权限节点更新（organization → institution）
-- ------------------------------------------------------------

UPDATE `sys_permissions`
SET `permission_code` = REPLACE(`permission_code`, 'organization:', 'institution:'),
    `module` = 'institution'
WHERE `module` = 'organization';
