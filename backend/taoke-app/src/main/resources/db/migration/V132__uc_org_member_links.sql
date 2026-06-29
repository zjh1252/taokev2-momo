-- ============================================================
-- V132: 淘课组织 ↔ UC 组织映射 + UC 成员关联
-- （原 V118 与 honor_files 冲突，改号至 V132）
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_uc_org_links` (
    `id`                 INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `org_type`           VARCHAR(32)  NOT NULL                 COMMENT '组织类型：INSTITUTION / ENTERPRISE_AGENT / ENTERPRISE_BUYER',
    `org_id`             INT          NOT NULL                 COMMENT '淘课组织扩展表主键 ID',
    `uc_p_root_id`       INT          NOT NULL                 COMMENT 'UC root_company_id（OpenAPI AUTH 头）',
    `unique_value`       TINYINT      NULL     DEFAULT NULL    COMMENT 'UC 租户唯一标识枚举 1~4',
    `unique_field_code`  VARCHAR(32)  NULL     DEFAULT NULL    COMMENT '唯一标识字段 code，如 mobile',
    `linked_by`          INT          NOT NULL                 COMMENT '关联操作人 user_id',
    `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_uc_org_type_id` (`org_type`, `org_id`),
    INDEX `idx_uc_p_root_id` (`uc_p_root_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='淘课组织与 UC 组织映射';

CREATE TABLE IF NOT EXISTS `user_uc_member_links` (
    `id`               INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `org_link_id`      INT          NOT NULL                 COMMENT 'user_uc_org_links.id',
    `user_id`          INT          NULL     DEFAULT NULL    COMMENT '淘课用户 ID（绑定后回填）',
    `identity_value`   VARCHAR(128) NOT NULL                 COMMENT 'UC 身份标识输入值',
    `p_stu_id`         INT          NULL     DEFAULT NULL    COMMENT 'UC tt_student.id',
    `profile_json`     JSON         NULL     DEFAULT NULL    COMMENT 'userList 全量详情（用户同意后）',
    `sync_status`      TINYINT      NOT NULL DEFAULT 0       COMMENT '0=仅 lookup，1=已同步详情',
    `binding_ref_type` VARCHAR(32)  NULL     DEFAULT NULL    COMMENT '关联绑定类型，如 INSTITUTION_EMPLOYEE',
    `binding_ref_id`   INT          NULL     DEFAULT NULL    COMMENT '关联绑定表主键',
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_uc_member_org_link` (`org_link_id`),
    INDEX `idx_uc_member_user` (`user_id`),
    INDEX `idx_uc_member_p_stu` (`p_stu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='淘课用户与 UC 成员关联';
