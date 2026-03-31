-- ============================================================
-- V1.2: 预置系统角色 + 初始超级管理员
-- ============================================================

-- 系统内置 RBAC 角色（不可删除）
INSERT INTO `sys_roles` (`role_code`, `role_name`, `description`, `is_system`, `is_active`) VALUES
('SUPER_ADMIN',      '超级管理员', '系统最高权限，绕过所有权限校验',          1, 1),
('PLATFORM_AUDITOR', '平台审核员', '后台审核、资料维护、数据操作等管理业务',  1, 1),
('PLATFORM_CS',      '平台客服',   '平台客服相关业务',                        1, 1);

-- 为「平台审核员」角色分配所有权限（管理员后续可按需调整）
INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR'),
    `id`,
    NOW()
FROM `sys_permissions`;

-- 为「平台客服」角色分配基础查看权限
INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_CS'),
    `id`,
    NOW()
FROM `sys_permissions`
WHERE `action_type` = 'VIEW';

-- 初始超级管理员账号（密码: fxx）
INSERT INTO `sys_users` (`phone`, `nickname`, `real_name`, `status`, `reg_origin`, `password_hash`) VALUES
('13265717020', '老方', '真老方', 1, 4,
 '$2b$10$.mUdfhBmaW3yM7JBR6C.tuf.OUvFq2LkOtIlVxi8zLIIak7RFx6qm');

-- 给该用户分配 SUPER_ADMIN 业务角色
INSERT INTO `sys_user_roles` (`user_id`, `role`, `status`, `approved_at`) VALUES
((SELECT `id` FROM `sys_users` WHERE `phone` = '13265717020'), 'SUPER_ADMIN', 1, NOW());

-- 给该用户分配 SUPER_ADMIN RBAC 角色
INSERT INTO `sys_user_role_assignments` (`user_id`, `role_id`, `assigned_by`) VALUES
((SELECT `id` FROM `sys_users` WHERE `phone` = '13265717020'),
 (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'SUPER_ADMIN'),
 (SELECT `id` FROM `sys_users` WHERE `phone` = '13265717020'));
