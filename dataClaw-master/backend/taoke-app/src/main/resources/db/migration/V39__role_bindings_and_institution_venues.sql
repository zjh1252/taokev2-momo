-- ============================================================
-- V39: 角色绑定关系完善 + 机构场地表
--
-- 1. 新建 user_enterprise_agent_trainer_bindings —— 经纪公司↔专家直接绑定表
-- 2. 现有 4 张绑定表统一补 reject_reason / initiator_user_id / note 字段（守卫式 ALTER）
-- 3. 新建 institution_venues —— 机构场地表
--
-- 绑定状态 BindingStatus 统一约定：
--   1=ACTIVE（已生效） / 2=PENDING（待确认） / 3=UNBOUND（已解绑） / 4=REJECTED（已拒绝）
-- ============================================================

-- ============================================================
-- 1. 新建 user_enterprise_agent_trainer_bindings
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_enterprise_agent_trainer_bindings` (
    `id`                    INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `enterprise_agent_id`   INT          NOT NULL                 COMMENT '经纪公司 ID（user_enterprise_agents.id）',
    `trainer_user_id`       INT          NOT NULL                 COMMENT '专家用户 ID',
    `status`                TINYINT      NOT NULL DEFAULT 2       COMMENT '绑定状态：1=生效，2=待确认，3=已解绑，4=已拒绝',
    `confirmed_at`          DATETIME     NULL     DEFAULT NULL    COMMENT '确认时间',
    `reject_reason`         VARCHAR(500) NULL     DEFAULT NULL    COMMENT '拒绝理由',
    `note`                  VARCHAR(500) NULL     DEFAULT NULL    COMMENT '发起备注',
    `initiator_user_id`     INT          NULL     DEFAULT NULL    COMMENT '发起方用户 ID（用于审计）',
    `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_enterprise_agent_trainer` (`enterprise_agent_id`, `trainer_user_id`),
    INDEX `idx_eat_trainer_user_id` (`trainer_user_id`),
    INDEX `idx_eat_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经纪公司-专家绑定表';

-- ============================================================
-- 2. 给现有 4 张绑定表统一补 reject_reason / initiator_user_id / note（缺则补）
--    重复执行安全（INFORMATION_SCHEMA + PREPARE/EXECUTE 守卫式 ALTER）
-- ============================================================

-- 2.1 user_agent_trainer_bindings.reject_reason
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_agent_trainer_bindings' AND COLUMN_NAME = 'reject_reason');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_agent_trainer_bindings` ADD COLUMN `reject_reason` VARCHAR(500) NULL DEFAULT NULL COMMENT ''拒绝理由''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.2 user_agent_trainer_bindings.initiator_user_id
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_agent_trainer_bindings' AND COLUMN_NAME = 'initiator_user_id');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_agent_trainer_bindings` ADD COLUMN `initiator_user_id` INT NULL DEFAULT NULL COMMENT ''发起方用户 ID''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.3 user_trainer_assistant_bindings.reject_reason
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_trainer_assistant_bindings' AND COLUMN_NAME = 'reject_reason');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_trainer_assistant_bindings` ADD COLUMN `reject_reason` VARCHAR(500) NULL DEFAULT NULL COMMENT ''拒绝理由''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.4 user_trainer_assistant_bindings.initiator_user_id
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_trainer_assistant_bindings' AND COLUMN_NAME = 'initiator_user_id');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_trainer_assistant_bindings` ADD COLUMN `initiator_user_id` INT NULL DEFAULT NULL COMMENT ''发起方用户 ID''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.5 user_trainer_assistant_bindings.note
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_trainer_assistant_bindings' AND COLUMN_NAME = 'note');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_trainer_assistant_bindings` ADD COLUMN `note` VARCHAR(500) NULL DEFAULT NULL COMMENT ''发起备注''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.6 user_institution_trainer_bindings.reject_reason
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_institution_trainer_bindings' AND COLUMN_NAME = 'reject_reason');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_institution_trainer_bindings` ADD COLUMN `reject_reason` VARCHAR(500) NULL DEFAULT NULL COMMENT ''拒绝理由''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.7 user_institution_trainer_bindings.initiator_user_id
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_institution_trainer_bindings' AND COLUMN_NAME = 'initiator_user_id');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_institution_trainer_bindings` ADD COLUMN `initiator_user_id` INT NULL DEFAULT NULL COMMENT ''发起方用户 ID''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.8 user_institution_trainer_bindings.note
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_institution_trainer_bindings' AND COLUMN_NAME = 'note');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_institution_trainer_bindings` ADD COLUMN `note` VARCHAR(500) NULL DEFAULT NULL COMMENT ''发起备注''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.9 user_institution_employee_bindings.reject_reason
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_institution_employee_bindings' AND COLUMN_NAME = 'reject_reason');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_institution_employee_bindings` ADD COLUMN `reject_reason` VARCHAR(500) NULL DEFAULT NULL COMMENT ''拒绝理由''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.10 user_institution_employee_bindings.initiator_user_id
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_institution_employee_bindings' AND COLUMN_NAME = 'initiator_user_id');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_institution_employee_bindings` ADD COLUMN `initiator_user_id` INT NULL DEFAULT NULL COMMENT ''发起方用户 ID''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.11 user_institution_employee_bindings.note
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_institution_employee_bindings' AND COLUMN_NAME = 'note');
SET @s := IF(@c = 0,
    'ALTER TABLE `user_institution_employee_bindings` ADD COLUMN `note` VARCHAR(500) NULL DEFAULT NULL COMMENT ''发起备注''',
    'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. 新建 institution_venues —— 机构场地
-- ============================================================
CREATE TABLE IF NOT EXISTS `institution_venues` (
    `id`              INT           NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `institution_id`  INT           NOT NULL                 COMMENT '所属机构 ID（user_institutions.id）',
    `name`            VARCHAR(200)  NOT NULL                 COMMENT '场地名称',
    `province_id`     INT           NULL     DEFAULT NULL    COMMENT '省份 ID',
    `city_id`         INT           NULL     DEFAULT NULL    COMMENT '城市 ID',
    `district_id`     INT           NULL     DEFAULT NULL    COMMENT '区县 ID',
    `address`         VARCHAR(500)  NULL     DEFAULT NULL    COMMENT '详细地址',
    `capacity`        INT           NULL     DEFAULT NULL    COMMENT '容纳人数',
    `cover_url`       VARCHAR(500)  NULL     DEFAULT NULL    COMMENT '封面图 URL',
    `description`     VARCHAR(2000) NULL     DEFAULT NULL    COMMENT '简介',
    `status`          TINYINT       NOT NULL DEFAULT 1       COMMENT '状态：1=启用，0=停用',
    `sort_order`      INT           NOT NULL DEFAULT 0       COMMENT '排序值，越大越靠前',
    `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_inst_venues_institution_id` (`institution_id`),
    INDEX `idx_inst_venues_status` (`status`),
    INDEX `idx_inst_venues_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构场地表';
