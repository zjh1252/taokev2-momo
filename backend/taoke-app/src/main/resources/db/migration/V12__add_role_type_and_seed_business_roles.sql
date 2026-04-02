-- ==============================================================
-- V12: sys_roles 增加 role_type 字段，区分业务角色与管理角色
--      种子化 8 个平台业务角色
-- ==============================================================

-- 1. 增加 role_type 字段
ALTER TABLE `sys_roles`
    ADD COLUMN `role_type` VARCHAR(20) NOT NULL DEFAULT 'PLATFORM'
        COMMENT '角色分类：BUSINESS=业务角色, PLATFORM=运营管理角色'
        AFTER `role_name`;

-- 2. 现有 3 条运营角色显式标记为 PLATFORM
UPDATE `sys_roles` SET `role_type` = 'PLATFORM'
WHERE `role_code` IN ('SUPER_ADMIN', 'PLATFORM_AUDITOR', 'PLATFORM_CS');

-- 3. 种子化 8 个业务角色（is_system=1 不可删除）
INSERT INTO `sys_roles` (`role_code`, `role_name`, `role_type`, `description`, `is_system`, `is_active`) VALUES
('ENTERPRISE_BUYER',     '企业培训采购方', 'BUSINESS', '企业培训需求方，平台核心付费用户',                 1, 1),
('BUYER',                '个人学员',       'BUSINESS', '个人学习需求方，购买在线课、报名公开课',           1, 1),
('TRAINER',              '专家',           'BUSINESS', '平台核心内容生产者与培训资源供给方',               1, 1),
('AGENT',                '专家经纪人',     'BUSINESS', '代理专家的商务推广、排课、签约等事务',             1, 1),
('ASSISTANT',            '专家助理',       'BUSINESS', '协助专家处理日常事务，由专家本人绑定',             1, 1),
('ENTERPRISE_AGENT',     '专家经纪公司',   'BUSINESS', '以公司主体代理多位专家的商务运营',                 1, 1),
('INSTITUTION',          '机构',           'BUSINESS', '培训机构，提供课程资源与培训服务',                 1, 1),
('INSTITUTION_EMPLOYEE', '机构员工',       'BUSINESS', '机构下属员工，协助机构管理课程与运营',             1, 1);
