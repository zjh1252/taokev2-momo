-- ============================================================
-- V1.1: 预置权限节点（仅当前开发阶段所需模块）
-- 按"功能模块 + 操作类型"组合定义权限树
-- ============================================================

INSERT INTO `sys_permissions` (`permission_code`, `permission_name`, `module`, `action_type`, `parent_id`, `sort_order`, `description`) VALUES
-- 用户管理
('user:view',       '查看用户列表',   'user',    'VIEW',   0, 100, NULL),
('user:freeze',     '冻结/解冻用户',  'user',    'EDIT',   0, 101, NULL),
('user:export',     '导出用户数据',   'user',    'EXPORT', 0, 102, NULL),
('user:import',     '批量导入用户',   'user',    'IMPORT', 0, 103, NULL),
('user:tag:edit',   '编辑用户标签',   'user',    'EDIT',   0, 104, NULL),

-- 专家管理
('trainer:view',    '查看专家列表',   'trainer',      'VIEW',   0, 200, NULL),
('trainer:review',  '审核专家入驻',   'trainer',      'REVIEW', 0, 201, NULL),
('trainer:edit',    '编辑专家信息',   'trainer',      'EDIT',   0, 202, NULL),

-- 经纪人管理
('agent:view',      '查看经纪人列表', 'agent',        'VIEW',   0, 300, NULL),
('agent:review',    '审核经纪人入驻', 'agent',        'REVIEW', 0, 301, NULL),

-- 机构管理
('organization:view',   '查看机构列表',   'organization', 'VIEW',   0, 400, NULL),
('organization:review', '审核机构入驻',   'organization', 'REVIEW', 0, 401, NULL),

-- 课程管理
('course:view',     '查看课程列表',   'course',  'VIEW',   0, 500, NULL),
('course:review',   '审核课程',       'course',  'REVIEW', 0, 501, NULL),
('course:edit',     '编辑课程',       'course',  'EDIT',   0, 502, NULL),

-- 版权课管理
('copyright_course:view',   '查看版权课列表', 'copyright_course', 'VIEW',   0, 550, NULL),
('copyright_course:review', '审核版权课',     'copyright_course', 'REVIEW', 0, 551, NULL),
('copyright_course:edit',   '编辑版权课配置', 'copyright_course', 'EDIT',   0, 552, NULL),

-- 系统设置
('system:config',     '系统配置管理',   'system', 'EDIT', 0, 980, NULL),
('system:backup',     '系统备份管理',   'system', 'EDIT', 0, 981, NULL),
('system:log:view',   '查看系统日志',   'system', 'VIEW', 0, 982, NULL),

-- 权限管理
('permission:role:manage', '角色管理',   'permission', 'EDIT', 0, 990, NULL),
('permission:assign',      '权限分配',   'permission', 'EDIT', 0, 991, NULL);
