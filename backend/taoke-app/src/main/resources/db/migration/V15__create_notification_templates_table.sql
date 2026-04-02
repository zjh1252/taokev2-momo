-- 通知模板表
CREATE TABLE `notification_templates` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `code`             VARCHAR(32)  NOT NULL COMMENT '模板编码，如 APPLY_PASSED',
    `channel`          VARCHAR(16)  NOT NULL DEFAULT 'in_app' COMMENT '通知渠道',
    `lang`             VARCHAR(10)  NOT NULL DEFAULT 'zh-CN' COMMENT '语言',
    `title_template`   VARCHAR(200)          COMMENT '标题模板，支持 {{变量}} 占位',
    `content_template` TEXT         NOT NULL COMMENT '内容模板，支持 {{变量}} 占位',
    `enabled`          TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0=禁用，1=启用',
    `remark`           VARCHAR(255)          COMMENT '备注/说明',
    `created_at`       DATETIME     NOT NULL,
    `updated_at`       DATETIME     NOT NULL,
    UNIQUE INDEX `uk_code` (`code`),
    INDEX `idx_notification_templates_code_lang` (`code`, `lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知模板表';

-- 预置常用模板
INSERT INTO `notification_templates` (`code`, `channel`, `lang`, `title_template`, `content_template`, `enabled`, `remark`, `created_at`, `updated_at`) VALUES
('APPLY_PASSED', 'in_app', 'zh-CN', '{{roleName}}入驻申请已通过', '恭喜！您的{{roleName}}入驻申请已审核通过，相关功能已开放。', 1, '角色申请审核通过通知', NOW(), NOW()),
('APPLY_REJECTED', 'in_app', 'zh-CN', '{{roleName}}入驻申请未通过', '很遗憾，您的{{roleName}}入驻申请未通过审核。原因：{{reason}}。您可以修改资料后重新提交。', 1, '角色申请驳回通知', NOW(), NOW()),
('SYSTEM_ANNOUNCEMENT', 'in_app', 'zh-CN', '{{title}}', '{{content}}', 1, '系统公告模板', NOW(), NOW());
