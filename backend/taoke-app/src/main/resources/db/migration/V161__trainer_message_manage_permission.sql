-- ============================================================
-- 专家留言管理权限（运营客服/审核员可处理）
-- ============================================================

INSERT INTO `sys_permissions` (`permission_code`, `permission_name`, `module`, `action_type`, `parent_id`, `sort_order`, `description`)
VALUES
    ('trainer-message:manage', '专家留言管理', 'interaction', 'EDIT', 0, 710, '平台运营-专家留言列表/处理/转需求');

INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_CS'),
    (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'trainer-message:manage'),
    NOW()
WHERE EXISTS (SELECT 1 FROM `sys_roles` WHERE `role_code` = 'PLATFORM_CS')
  AND EXISTS (SELECT 1 FROM `sys_permissions` WHERE `permission_code` = 'trainer-message:manage')
  AND NOT EXISTS (
      SELECT 1 FROM `sys_role_permissions` rp
      WHERE rp.role_id = (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_CS')
        AND rp.permission_id = (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'trainer-message:manage')
  );

INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR'),
    (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'trainer-message:manage'),
    NOW()
WHERE EXISTS (SELECT 1 FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR')
  AND EXISTS (SELECT 1 FROM `sys_permissions` WHERE `permission_code` = 'trainer-message:manage')
  AND NOT EXISTS (
      SELECT 1 FROM `sys_role_permissions` rp
      WHERE rp.role_id = (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR')
        AND rp.permission_id = (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'trainer-message:manage')
  );
