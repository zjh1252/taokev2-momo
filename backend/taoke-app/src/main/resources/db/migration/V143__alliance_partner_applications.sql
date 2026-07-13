-- V143: 培训合伙人申请表 + 合约审核权限
CREATE TABLE `alliance_partner_applications` (
    `id`                INT          NOT NULL AUTO_INCREMENT,
    `user_id`           INT          NOT NULL COMMENT '申请人用户 ID',
    `partner_code`      VARCHAR(64)  NOT NULL COMMENT '甲方编号 TPC_...',
    `contact_name`      VARCHAR(64)  NOT NULL COMMENT '联系人名字',
    `company_name`      VARCHAR(128) NOT NULL COMMENT '公司名称',
    `company_phone`     VARCHAR(32)  NOT NULL COMMENT '公司电话',
    `company_email`     VARCHAR(128) NOT NULL COMMENT '公司邮箱',
    `province_id`       INT          NOT NULL DEFAULT 0 COMMENT '省份 ID',
    `city_id`           INT          NOT NULL DEFAULT 0 COMMENT '城市 ID',
    `legal_person`      VARCHAR(64)  NOT NULL COMMENT '公司法人',
    `legal_id_card`     VARCHAR(32)  NOT NULL COMMENT '法人身份证',
    `contact_qq`        VARCHAR(32)  NULL COMMENT '联系人 QQ',
    `agreement_version` VARCHAR(32)  NOT NULL DEFAULT 'v1' COMMENT '协议版本',
    `status`            TINYINT(2)   NOT NULL DEFAULT 1 COMMENT '1待审核 2已通过 3已驳回',
    `reject_reason`     VARCHAR(512) NULL COMMENT '驳回原因',
    `reviewed_at`       DATETIME     NULL COMMENT '审核时间',
    `reviewed_by`       INT          NULL COMMENT '审核人用户 ID',
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_partner_code` (`partner_code`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训合伙人申请';

INSERT INTO `sys_permissions` (`permission_code`, `permission_name`, `module`, `action_type`, `parent_id`, `sort_order`, `description`)
VALUES ('alliance:partner:audit', '审核培训合伙人申请', 'alliance', 'REVIEW', 0, 700, '合约管理-培训合伙人通过/驳回');

INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR'),
    (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'alliance:partner:audit'),
    NOW();
