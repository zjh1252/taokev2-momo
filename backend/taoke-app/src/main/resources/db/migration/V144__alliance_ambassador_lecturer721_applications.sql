-- V144: 推广大使 / 721 讲师合作申请表 + 审核权限
CREATE TABLE `alliance_ambassador_applications` (
    `id`                INT          NOT NULL AUTO_INCREMENT,
    `user_id`           INT          NOT NULL COMMENT '申请人用户 ID',
    `ambassador_code`   VARCHAR(64)  NOT NULL COMMENT '甲方编号 AMB_...',
    `agreement_version` VARCHAR(32)  NOT NULL DEFAULT 'v1' COMMENT '协议版本',
    `status`            TINYINT(2)   NOT NULL DEFAULT 1 COMMENT '1待审核 2已通过 3已驳回',
    `reject_reason`     VARCHAR(512) NULL COMMENT '驳回原因',
    `reviewed_at`       DATETIME     NULL COMMENT '审核时间',
    `reviewed_by`       INT          NULL COMMENT '审核人用户 ID',
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ambassador_code` (`ambassador_code`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推广大使申请';

CREATE TABLE `alliance_lecturer721_applications` (
    `id`                INT            NOT NULL AUTO_INCREMENT,
    `user_id`           INT            NOT NULL COMMENT '申请人用户 ID',
    `application_code`  VARCHAR(64)    NOT NULL COMMENT '申请编号 L721_...',
    `lecturer_name`     VARCHAR(64)    NOT NULL COMMENT '讲师姓名',
    `id_card_no`        VARCHAR(32)    NOT NULL COMMENT '身份证号',
    `coop_years`        TINYINT(2)     NOT NULL COMMENT '合作年限 1/2/3',
    `daily_fee`         DECIMAL(12, 2) NOT NULL COMMENT '课酬元/天',
    `address`           VARCHAR(255)   NOT NULL COMMENT '地址',
    `phone`             VARCHAR(32)    NOT NULL COMMENT '手机号',
    `wechat`            VARCHAR(64)    NOT NULL COMMENT '微信',
    `email`             VARCHAR(128)   NOT NULL COMMENT '邮箱',
    `bank_name`         VARCHAR(128)   NOT NULL COMMENT '开户银行',
    `bank_account`      VARCHAR(64)    NOT NULL COMMENT '银行账号',
    `signature_url`     VARCHAR(512)   NOT NULL COMMENT '签字图片 URL',
    `agreement_version` VARCHAR(32)    NOT NULL DEFAULT 'v1' COMMENT '协议版本',
    `status`            TINYINT(2)     NOT NULL DEFAULT 1 COMMENT '1待审核 2已通过 3已驳回',
    `reject_reason`     VARCHAR(512)   NULL COMMENT '驳回原因',
    `reviewed_at`       DATETIME       NULL COMMENT '审核时间',
    `reviewed_by`       INT            NULL COMMENT '审核人用户 ID',
    `created_at`        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_application_code` (`application_code`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='721讲师合作申请';

INSERT INTO `sys_permissions` (`permission_code`, `permission_name`, `module`, `action_type`, `parent_id`, `sort_order`, `description`)
VALUES
    ('alliance:ambassador:audit', '审核推广大使申请', 'alliance', 'REVIEW', 0, 701, '合约管理-推广大使通过/驳回'),
    ('alliance:lecturer721:audit', '审核721讲师合作申请', 'alliance', 'REVIEW', 0, 702, '合约管理-721讲师合作通过/驳回');

INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR'),
    (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'alliance:ambassador:audit'),
    NOW();

INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR'),
    (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'alliance:lecturer721:audit'),
    NOW();
