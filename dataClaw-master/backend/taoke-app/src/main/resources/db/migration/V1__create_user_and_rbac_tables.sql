-- ============================================================
-- V1: 用户身份 + RBAC 权限 核心表
-- 共 13 张表，分两大类：
--   1. 用户身份与业务数据（9 张）
--   2. RBAC 权限管理（4 张）
-- 所有表统一使用 sys_ 前缀（平台基础层）
-- ============================================================

-- ------------------------------------------------------------
-- 1. sys_users — 用户基础表（全角色通用）
-- ------------------------------------------------------------
CREATE TABLE `sys_users` (
    `id`            INT             NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `phone`         VARCHAR(20)     NULL     DEFAULT NULL    COMMENT '手机号，唯一',
    `email`         VARCHAR(128)    NULL     DEFAULT NULL    COMMENT '邮箱，唯一',
    `password_hash` VARCHAR(255)    NULL     DEFAULT NULL    COMMENT 'BCrypt 加密密码；第三方登录用户可能无密码',
    `nickname`      VARCHAR(64)     NULL     DEFAULT NULL    COMMENT '昵称',
    `real_name`     VARCHAR(64)     NULL     DEFAULT NULL    COMMENT '真实姓名',
    `avatar_url`    VARCHAR(512)    NULL     DEFAULT NULL    COMMENT '头像 URL',
    `gender`        TINYINT         NOT NULL DEFAULT 0       COMMENT '性别：0=未知，1=男，2=女',
    `post_code`     VARCHAR(10)     NOT NULL DEFAULT ''      COMMENT '邮编',
    `province_id`   INT             NOT NULL DEFAULT 0       COMMENT '省份 ID',
    `city_id`       INT             NOT NULL DEFAULT 0       COMMENT '城市 ID',
    `district_id`   INT             NOT NULL DEFAULT 0       COMMENT '区县 ID',
    `town_id`       INT             NOT NULL DEFAULT 0       COMMENT '乡镇 ID',
    `address`       VARCHAR(200)    NOT NULL DEFAULT ''      COMMENT '详细地址',
    `status`        TINYINT         NOT NULL DEFAULT 1       COMMENT '账号状态：1=正常，2=冻结，3=注销',
    `freeze_reason` VARCHAR(255)    NULL     DEFAULT NULL    COMMENT '冻结原因',
    `last_login_at` DATETIME        NULL     DEFAULT NULL    COMMENT '最近登录时间',
    `last_login_ip` VARCHAR(45)     NULL     DEFAULT NULL    COMMENT '最近登录 IP',
    `reg_origin`    TINYINT         NOT NULL DEFAULT 1       COMMENT '注册来源：1=PC官网，2=H5，3=微信小程序，4=后台创建',
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_phone` (`phone`),
    UNIQUE INDEX `idx_email` (`email`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础表';

-- ------------------------------------------------------------
-- 2. sys_user_roles — 用户业务角色表（Layer 1: 业务身份层）
--    角色编码（varchar(32)）：ENTERPRISE_BUYER / BUYER / TRAINER /
--    AGENT / ASSISTANT / ENTERPRISE_AGENT / ORGANIZATION /
--    ORGANIZATION_EMPLOYEE / PLATFORM_AUDITOR / PLATFORM_CS /
--    SUPER_ADMIN
-- ------------------------------------------------------------
CREATE TABLE `sys_user_roles` (
    `id`          INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     INT          NOT NULL                 COMMENT '用户 ID',
    `role`        VARCHAR(32)  NOT NULL                 COMMENT '角色编码',
    `status`      TINYINT      NOT NULL DEFAULT 1       COMMENT '角色状态：1=生效，2=待审核，3=审核驳回，4=已禁用',
    `approved_at` DATETIME     NULL     DEFAULT NULL    COMMENT '审核通过时间',
    `approved_by` INT          NULL     DEFAULT NULL    COMMENT '审核人用户 ID',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_role` (`user_id`, `role`),
    INDEX `idx_role` (`role`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户业务角色表';

-- ------------------------------------------------------------
-- 3. sys_enterprises — 企业信息表（企业培训采购方扩展信息）
-- ------------------------------------------------------------
CREATE TABLE `sys_enterprises` (
    `id`            INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`       INT          NOT NULL                 COMMENT '用户 ID',
    `company_name`  VARCHAR(128) NULL     DEFAULT NULL    COMMENT '企业名称',
    `industry`      VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '所属行业',
    `company_size`  VARCHAR(32)  NULL     DEFAULT NULL    COMMENT '企业规模',
    `contact_name`  VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '联系人姓名',
    `contact_phone` VARCHAR(20)  NULL     DEFAULT NULL    COMMENT '联系电话',
    `post_code`     VARCHAR(10)  NOT NULL DEFAULT ''      COMMENT '企业所在邮编',
    `province_id`   INT          NOT NULL DEFAULT 0       COMMENT '企业所在省份',
    `city_id`       INT          NOT NULL DEFAULT 0       COMMENT '企业所在城市',
    `district_id`   INT          NOT NULL DEFAULT 0       COMMENT '企业所在区县',
    `town_id`       INT          NOT NULL DEFAULT 0       COMMENT '企业所在乡镇',
    `address`       VARCHAR(200) NOT NULL DEFAULT ''      COMMENT '企业详细地址',
    `training_tags` VARCHAR(512) NULL     DEFAULT NULL    COMMENT '培训需求标签，JSON 数组',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`),
    INDEX `idx_company_name` (`company_name`),
    INDEX `idx_industry` (`industry`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业信息表';

-- ------------------------------------------------------------
-- 4. sys_buyer_profiles — 个人学员扩展信息表
-- ------------------------------------------------------------
CREATE TABLE `sys_buyer_profiles` (
    `id`            INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`       INT          NOT NULL                 COMMENT '用户 ID',
    `occupation`    VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '职业',
    `learning_tags` VARCHAR(512) NULL     DEFAULT NULL    COMMENT '学习兴趣标签，JSON 数组',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='个人学员扩展信息表';

-- ------------------------------------------------------------
-- 5. sys_user_oauth_bindings — 第三方登录绑定表
-- ------------------------------------------------------------
CREATE TABLE `sys_user_oauth_bindings` (
    `id`               INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`          INT          NOT NULL                 COMMENT '用户 ID',
    `provider`         VARCHAR(20)  NOT NULL                 COMMENT '第三方平台：WECHAT / ALIPAY',
    `open_id`          VARCHAR(128) NOT NULL                 COMMENT '第三方 OpenID',
    `union_id`         VARCHAR(128) NULL     DEFAULT NULL    COMMENT '第三方 UnionID（微信体系）',
    `oauth_nickname`   VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '第三方平台昵称',
    `oauth_avatar_url` VARCHAR(512) NULL     DEFAULT NULL    COMMENT '第三方平台头像',
    `bound_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_provider_openid` (`provider`, `open_id`),
    UNIQUE INDEX `idx_user_provider` (`user_id`, `provider`),
    INDEX `idx_union_id` (`union_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='第三方登录绑定表';

-- ------------------------------------------------------------
-- 6. sys_user_sessions — 用户登录会话表
-- ------------------------------------------------------------
CREATE TABLE `sys_user_sessions` (
    `id`            INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`       INT          NOT NULL                 COMMENT '用户 ID',
    `session_token` VARCHAR(128) NOT NULL                 COMMENT '会话令牌（JWT jti）',
    `device_name`   VARCHAR(128) NULL     DEFAULT NULL    COMMENT '设备名称',
    `device_type`   VARCHAR(20)  NULL     DEFAULT NULL    COMMENT '设备类型：PC / MOBILE / TABLET',
    `login_ip`      VARCHAR(45)  NOT NULL                 COMMENT '登录 IP',
    `login_city`    VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '登录 IP 所属城市',
    `is_active`     TINYINT      NOT NULL DEFAULT 1       COMMENT '是否活跃：1=活跃，0=已下线',
    `login_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    `logout_at`     DATETIME     NULL     DEFAULT NULL    COMMENT '下线时间',
    `expires_at`    DATETIME     NOT NULL                 COMMENT '会话过期时间',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_session_token` (`session_token`),
    INDEX `idx_user_active` (`user_id`, `is_active`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录会话表';

-- ------------------------------------------------------------
-- 7. sys_user_operation_logs — 用户操作日志表
-- ------------------------------------------------------------
CREATE TABLE `sys_user_operation_logs` (
    `id`            INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`       INT          NOT NULL                 COMMENT '操作对象用户 ID',
    `operator_id`   INT          NULL     DEFAULT NULL    COMMENT '操作人用户 ID',
    `action`        VARCHAR(64)  NOT NULL                 COMMENT '操作类型：LOGIN / LOGOUT / CHANGE_PASSWORD 等',
    `action_detail` VARCHAR(512) NULL     DEFAULT NULL    COMMENT '操作详情描述',
    `ip`            VARCHAR(45)  NULL     DEFAULT NULL    COMMENT '操作时 IP',
    `user_agent`    VARCHAR(512) NULL     DEFAULT NULL    COMMENT '浏览器 User-Agent',
    `result`        TINYINT      NOT NULL DEFAULT 1       COMMENT '操作结果：1=成功，0=失败',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_operator_id` (`operator_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作日志表';

-- ------------------------------------------------------------
-- 8. sys_user_tags — 用户标签表
-- ------------------------------------------------------------
CREATE TABLE `sys_user_tags` (
    `id`         INT         NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`    INT         NOT NULL                 COMMENT '用户 ID',
    `tag_key`    VARCHAR(32) NOT NULL                 COMMENT '标签分类：USER_TYPE / TRAINING_NEED / LEARNING_INTEREST / CUSTOM',
    `tag_value`  VARCHAR(64) NOT NULL                 COMMENT '标签值',
    `source`     TINYINT     NOT NULL DEFAULT 1       COMMENT '标签来源：1=系统自动，2=用户自选，3=管理员设置',
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_tag` (`user_id`, `tag_key`, `tag_value`),
    INDEX `idx_tag_key_value` (`tag_key`, `tag_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户标签表';

-- ------------------------------------------------------------
-- 9. sys_verification_codes — 短信/邮件验证码表
-- ------------------------------------------------------------
CREATE TABLE `sys_verification_codes` (
    `id`         INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `target`     VARCHAR(128) NOT NULL                 COMMENT '发送目标（手机号或邮箱）',
    `code`       VARCHAR(10)  NOT NULL                 COMMENT '验证码',
    `type`       VARCHAR(32)  NOT NULL                 COMMENT '用途：REGISTER / LOGIN / RESET_PASSWORD / CHANGE_PHONE / CHANGE_EMAIL',
    `send_type`  VARCHAR(10)  NOT NULL                 COMMENT '发送渠道：SMS / EMAIL',
    `is_used`    TINYINT      NOT NULL DEFAULT 0       COMMENT '是否已使用：0=未使用，1=已使用',
    `expires_at` DATETIME     NOT NULL                 COMMENT '过期时间',
    `ip`         VARCHAR(45)  NULL     DEFAULT NULL    COMMENT '请求 IP',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_target_type` (`target`, `type`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信邮件验证码表';

-- ============================================================
-- RBAC 权限管理（Layer 2: 权限授权层）
-- ============================================================

-- ------------------------------------------------------------
-- 10. sys_roles — RBAC 角色定义表
-- ------------------------------------------------------------
CREATE TABLE `sys_roles` (
    `id`          INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `role_code`   VARCHAR(64)  NOT NULL                 COMMENT '角色编码，唯一',
    `role_name`   VARCHAR(64)  NOT NULL                 COMMENT '角色名称',
    `description` VARCHAR(255) NULL     DEFAULT NULL    COMMENT '角色描述',
    `is_system`   TINYINT      NOT NULL DEFAULT 0       COMMENT '是否系统内置：1=是（不可删除），0=否',
    `is_active`   TINYINT      NOT NULL DEFAULT 1       COMMENT '是否启用：1=启用，0=停用',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_role_code` (`role_code`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RBAC 角色定义表';

-- ------------------------------------------------------------
-- 11. sys_permissions — 权限节点表（树形结构）
-- ------------------------------------------------------------
CREATE TABLE `sys_permissions` (
    `id`              INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `permission_code` VARCHAR(128) NOT NULL                 COMMENT '权限编码，唯一，如 course:review',
    `permission_name` VARCHAR(64)  NOT NULL                 COMMENT '权限名称',
    `module`          VARCHAR(64)  NOT NULL                 COMMENT '所属功能模块',
    `action_type`     VARCHAR(20)  NOT NULL                 COMMENT '操作类型：VIEW/CREATE/EDIT/DELETE/REVIEW/EXPORT/IMPORT',
    `parent_id`       INT          NOT NULL DEFAULT 0       COMMENT '父权限 ID，0 表示顶级节点',
    `sort_order`      INT          NOT NULL DEFAULT 0       COMMENT '排序权重',
    `description`     VARCHAR(255) NULL     DEFAULT NULL    COMMENT '权限描述',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_permission_code` (`permission_code`),
    INDEX `idx_module` (`module`),
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_action_type` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限节点表';

-- ------------------------------------------------------------
-- 12. sys_role_permissions — 角色-权限关联表
-- ------------------------------------------------------------
CREATE TABLE `sys_role_permissions` (
    `id`            INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `role_id`       INT      NOT NULL                 COMMENT '角色 ID',
    `permission_id` INT      NOT NULL                 COMMENT '权限 ID',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_role_permission` (`role_id`, `permission_id`),
    INDEX `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色-权限关联表';

-- ------------------------------------------------------------
-- 13. sys_user_role_assignments — 用户-RBAC角色分配表
-- ------------------------------------------------------------
CREATE TABLE `sys_user_role_assignments` (
    `id`          INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     INT      NOT NULL                 COMMENT '用户 ID',
    `role_id`     INT      NOT NULL                 COMMENT '角色 ID',
    `assigned_by` INT      NOT NULL                 COMMENT '分配人用户 ID',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '分配时间',
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_role` (`user_id`, `role_id`),
    INDEX `idx_role_id` (`role_id`),
    INDEX `idx_assigned_by` (`assigned_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-RBAC角色分配表';
