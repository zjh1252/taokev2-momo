-- ============================================================
-- V2: 角色扩展表 + 角色间关系绑定表
--
-- 1. 重命名已有表（sys_ → user_ 前缀）：2 张
-- 2. 新建角色扩展表：6 张
-- 3. 新建关系绑定表：5 张
--
-- 角色扩展表归属 user 模块，统一使用 user_ 前缀
-- ============================================================

-- ============================================================
-- Part 1: 重命名已有表
-- ============================================================

RENAME TABLE `sys_enterprises` TO `user_enterprises`;
RENAME TABLE `sys_buyer_profiles` TO `user_buyers`;

-- ============================================================
-- Part 2: 新建角色扩展表（6 张）
-- ============================================================

-- ------------------------------------------------------------
-- 1. user_trainers — 专家扩展信息表（TRAINER）
-- ------------------------------------------------------------
CREATE TABLE `user_trainers` (
    `id`                   INT           NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`              INT           NOT NULL                 COMMENT '用户 ID',
    `title`                VARCHAR(64)   NULL     DEFAULT NULL    COMMENT '头衔（如：高级讲师、资深顾问）',
    `bio`                  TEXT          NULL                     COMMENT '个人简介（支持富文本）',
    `specialties`          VARCHAR(512)  NULL     DEFAULT NULL    COMMENT '擅长领域，JSON 数组',
    `experience_years`     INT           NULL     DEFAULT NULL    COMMENT '从业年限',
    `education`            VARCHAR(64)   NULL     DEFAULT NULL    COMMENT '最高学历',
    `qualification_level`  TINYINT       NOT NULL DEFAULT 0       COMMENT '资质等级：0=普通，1=认证，2=高级认证',
    `homepage_config`      JSON          NULL                     COMMENT '主页配置（字体、颜色、布局等）',
    `service_city_ids`     VARCHAR(512)  NULL     DEFAULT NULL    COMMENT '授课城市 ID 列表，JSON 数组',
    `contact_preference`   VARCHAR(128)  NULL     DEFAULT NULL    COMMENT '联系偏好（如：微信优先、电话优先）',
    `created_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`),
    INDEX `idx_qualification_level` (`qualification_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家扩展信息表';

-- ------------------------------------------------------------
-- 2. user_agents — 专家经纪人扩展信息表（AGENT）
-- ------------------------------------------------------------
CREATE TABLE `user_agents` (
    `id`               INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`          INT          NOT NULL                 COMMENT '用户 ID',
    `bio`              TEXT         NULL                     COMMENT '服务介绍',
    `specialties`      VARCHAR(512) NULL     DEFAULT NULL    COMMENT '擅长领域，JSON 数组',
    `service_city_ids` VARCHAR(512) NULL     DEFAULT NULL    COMMENT '服务城市 ID 列表，JSON 数组',
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家经纪人扩展信息表';

-- ------------------------------------------------------------
-- 3. user_assistants — 专家助理扩展信息表（ASSISTANT）
-- ------------------------------------------------------------
CREATE TABLE `user_assistants` (
    `id`          INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     INT          NOT NULL                 COMMENT '用户 ID',
    `bio`         VARCHAR(512) NULL     DEFAULT NULL    COMMENT '服务描述',
    `auth_scope`  VARCHAR(512) NULL     DEFAULT NULL    COMMENT '授权范围说明',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家助理扩展信息表';

-- ------------------------------------------------------------
-- 4. user_enterprise_agents — 专家经纪公司扩展信息表（ENTERPRISE_AGENT）
-- ------------------------------------------------------------
CREATE TABLE `user_enterprise_agents` (
    `id`                    INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`               INT          NOT NULL                 COMMENT '用户 ID（第一个认证的经纪人即为公司负责人）',
    `company_name`          VARCHAR(128) NULL     DEFAULT NULL    COMMENT '公司名称',
    `license_no`            VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '营业执照号',
    `legal_person`          VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '法人姓名',
    `industry`              VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '所属行业',
    `company_size`          VARCHAR(32)  NULL     DEFAULT NULL    COMMENT '公司规模',
    `contact_name`          VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '联系人姓名',
    `contact_phone`         VARCHAR(20)  NULL     DEFAULT NULL    COMMENT '联系电话',
    `post_code`             VARCHAR(10)  NOT NULL DEFAULT ''      COMMENT '公司所在邮编',
    `province_id`           INT          NOT NULL DEFAULT 0       COMMENT '公司所在省份',
    `city_id`               INT          NOT NULL DEFAULT 0       COMMENT '公司所在城市',
    `district_id`           INT          NOT NULL DEFAULT 0       COMMENT '公司所在区县',
    `town_id`               INT          NOT NULL DEFAULT 0       COMMENT '公司所在乡镇',
    `address`               VARCHAR(200) NOT NULL DEFAULT ''      COMMENT '公司详细地址',
    `qualification_doc_url` VARCHAR(512) NULL     DEFAULT NULL    COMMENT '资质证明文件 URL',
    `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`),
    INDEX `idx_company_name` (`company_name`),
    INDEX `idx_license_no` (`license_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家经纪公司扩展信息表';

-- ------------------------------------------------------------
-- 5. user_organizations — 机构扩展信息表（ORGANIZATION）
-- ------------------------------------------------------------
CREATE TABLE `user_organizations` (
    `id`              INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`         INT          NOT NULL                 COMMENT '用户 ID',
    `org_name`        VARCHAR(128) NULL     DEFAULT NULL    COMMENT '机构名称',
    `org_type`        TINYINT      NOT NULL DEFAULT 0       COMMENT '机构类型：0=非高校，1=高校',
    `license_no`      VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '营业执照号',
    `bio`             TEXT         NULL                     COMMENT '机构简介（支持富文本）',
    `homepage_config` JSON         NULL                     COMMENT '主页配置（字体、颜色、布局等）',
    `contact_name`    VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '联系人姓名',
    `contact_phone`   VARCHAR(20)  NULL     DEFAULT NULL    COMMENT '联系电话',
    `show_contact`    TINYINT      NOT NULL DEFAULT 0       COMMENT '是否公开联系方式：0=不公开，1=公开（高校可公开，非高校不可）',
    `post_code`       VARCHAR(10)  NOT NULL DEFAULT ''      COMMENT '机构所在邮编',
    `province_id`     INT          NOT NULL DEFAULT 0       COMMENT '机构所在省份',
    `city_id`         INT          NOT NULL DEFAULT 0       COMMENT '机构所在城市',
    `district_id`     INT          NOT NULL DEFAULT 0       COMMENT '机构所在区县',
    `town_id`         INT          NOT NULL DEFAULT 0       COMMENT '机构所在乡镇',
    `address`         VARCHAR(200) NOT NULL DEFAULT ''      COMMENT '机构详细地址',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`),
    INDEX `idx_org_name` (`org_name`),
    INDEX `idx_org_type` (`org_type`),
    INDEX `idx_license_no` (`license_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构扩展信息表';

-- ------------------------------------------------------------
-- 6. user_org_employees — 机构员工扩展信息表（ORGANIZATION_EMPLOYEE）
-- ------------------------------------------------------------
CREATE TABLE `user_org_employees` (
    `id`          INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     INT          NOT NULL                 COMMENT '用户 ID',
    `org_id`      INT          NOT NULL                 COMMENT '所属机构 ID（user_organizations.id）',
    `position`    VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '职位',
    `department`  VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '部门',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_user_id` (`user_id`),
    INDEX `idx_org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构员工扩展信息表';

-- ============================================================
-- Part 3: 新建关系绑定表（5 张）
-- ============================================================

-- ------------------------------------------------------------
-- 1. user_agent_trainer_bindings — 经纪人 ↔ 专家 绑定表（多对多）
--    绑定需专家确认
-- ------------------------------------------------------------
CREATE TABLE `user_agent_trainer_bindings` (
    `id`               INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `agent_user_id`    INT          NOT NULL                 COMMENT '经纪人用户 ID',
    `trainer_user_id`  INT          NOT NULL                 COMMENT '专家用户 ID',
    `status`           TINYINT      NOT NULL DEFAULT 2       COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
    `confirmed_at`     DATETIME     NULL     DEFAULT NULL    COMMENT '确认时间',
    `note`             VARCHAR(255) NULL     DEFAULT NULL    COMMENT '备注',
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_agent_trainer` (`agent_user_id`, `trainer_user_id`),
    INDEX `idx_trainer_user_id` (`trainer_user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经纪人-专家绑定表';

-- ------------------------------------------------------------
-- 2. user_trainer_assistant_bindings — 专家 ↔ 助理 绑定表（一对一）
--    一个专家只能关联一个助理，绑定需专家确认
-- ------------------------------------------------------------
CREATE TABLE `user_trainer_assistant_bindings` (
    `id`                 INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `trainer_user_id`    INT          NOT NULL                 COMMENT '专家用户 ID',
    `assistant_user_id`  INT          NOT NULL                 COMMENT '助理用户 ID',
    `status`             TINYINT      NOT NULL DEFAULT 2       COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
    `confirmed_at`       DATETIME     NULL     DEFAULT NULL    COMMENT '确认时间',
    `auth_scope`         VARCHAR(512) NULL     DEFAULT NULL    COMMENT '授权范围（JSON 数组，如 ["edit_profile","manage_course"]）',
    `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_trainer_user_id` (`trainer_user_id`),
    UNIQUE INDEX `idx_assistant_user_id` (`assistant_user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家-助理绑定表';

-- ------------------------------------------------------------
-- 3. user_org_trainer_bindings — 机构 ↔ 专家 绑定表（多对多）
--    专家挂靠机构，绑定需专家确认
-- ------------------------------------------------------------
CREATE TABLE `user_org_trainer_bindings` (
    `id`               INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `org_id`           INT      NOT NULL                 COMMENT '机构 ID（user_organizations.id）',
    `trainer_user_id`  INT      NOT NULL                 COMMENT '专家用户 ID',
    `status`           TINYINT  NOT NULL DEFAULT 2       COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
    `confirmed_at`     DATETIME NULL     DEFAULT NULL    COMMENT '确认时间',
    `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_org_trainer` (`org_id`, `trainer_user_id`),
    INDEX `idx_trainer_user_id` (`trainer_user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构-专家绑定表';

-- ------------------------------------------------------------
-- 4. user_enterprise_agent_members — 经纪公司 → 经纪人 成员表（一对多）
--    第一个认证该公司的经纪人默认为负责人
-- ------------------------------------------------------------
CREATE TABLE `user_enterprise_agent_members` (
    `id`                  INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `enterprise_agent_id` INT      NOT NULL                 COMMENT '经纪公司 ID（user_enterprise_agents.id）',
    `agent_user_id`       INT      NOT NULL                 COMMENT '经纪人用户 ID',
    `is_leader`           TINYINT  NOT NULL DEFAULT 0       COMMENT '是否负责人：0=否，1=是',
    `joined_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_enterprise_agent` (`enterprise_agent_id`, `agent_user_id`),
    INDEX `idx_agent_user_id` (`agent_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经纪公司-经纪人成员表';

-- ------------------------------------------------------------
-- 5. user_org_employee_bindings — 机构 → 员工 绑定表（一对多）
--    需机构验证绑定关系
-- ------------------------------------------------------------
CREATE TABLE `user_org_employee_bindings` (
    `id`               INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `org_id`           INT      NOT NULL                 COMMENT '机构 ID（user_organizations.id）',
    `employee_user_id` INT      NOT NULL                 COMMENT '员工用户 ID',
    `status`           TINYINT  NOT NULL DEFAULT 2       COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
    `confirmed_at`     DATETIME NULL     DEFAULT NULL    COMMENT '确认时间',
    `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_org_employee` (`org_id`, `employee_user_id`),
    INDEX `idx_employee_user_id` (`employee_user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构-员工绑定表';
