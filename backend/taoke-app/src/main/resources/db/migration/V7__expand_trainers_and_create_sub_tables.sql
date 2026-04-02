-- ==============================================================
-- V7: 扩展 user_trainers 主表字段 + 创建专家子表
-- ==============================================================

-- ------------------------------------------------------------
-- 1. ALTER user_trainers — 新增 PRD 定义的核心字段
-- ------------------------------------------------------------

-- 基础信息
ALTER TABLE `user_trainers`
    ADD COLUMN `name`       VARCHAR(100)  NULL     DEFAULT NULL    COMMENT '讲师姓名'          AFTER `user_id`,
    ADD COLUMN `avatar`     VARCHAR(500)  NULL     DEFAULT ''      COMMENT '头像 URL'           AFTER `name`,
    ADD COLUMN `gender`     TINYINT       NULL     DEFAULT 0       COMMENT '性别：0=未知，1=男，2=女' AFTER `avatar`,
    ADD COLUMN `phone`      VARCHAR(20)   NULL     DEFAULT NULL    COMMENT '联系电话'           AFTER `gender`,
    ADD COLUMN `email`      VARCHAR(200)  NULL     DEFAULT ''      COMMENT '电子邮箱'           AFTER `phone`,
    ADD COLUMN `post_code`  VARCHAR(10)   NULL     DEFAULT ''      COMMENT '邮编'               AFTER `email`,
    ADD COLUMN `province_id` INT          NULL     DEFAULT 0       COMMENT '省份 ID'            AFTER `post_code`,
    ADD COLUMN `city_id`    INT           NULL     DEFAULT 0       COMMENT '城市 ID'            AFTER `province_id`,
    ADD COLUMN `district_id` INT          NULL     DEFAULT 0       COMMENT '区县 ID'            AFTER `city_id`,
    ADD COLUMN `town_id`    INT           NULL     DEFAULT 0       COMMENT '乡镇 ID'            AFTER `district_id`,
    ADD COLUMN `address`    VARCHAR(200)  NULL     DEFAULT ''      COMMENT '详细地址'           AFTER `town_id`;

-- 专业信息
ALTER TABLE `user_trainers`
    ADD COLUMN `expertise_tags`  VARCHAR(500)  NULL DEFAULT ''   COMMENT '擅长标签，逗号分隔'    AFTER `specialties`,
    ADD COLUMN `teaching_years`  INT           NULL DEFAULT 0    COMMENT '培训年限'              AFTER `experience_years`,
    ADD COLUMN `intro`           LONGTEXT      NULL              COMMENT '个人简介（富文本）'     AFTER `bio`,
    ADD COLUMN `background`      TEXT          NULL              COMMENT '从业经历/背景'          AFTER `intro`,
    ADD COLUMN `good_at`         TEXT          NULL              COMMENT '专长描述'               AFTER `background`,
    ADD COLUMN `teaching_style`  VARCHAR(500)  NULL DEFAULT ''   COMMENT '授课风格'              AFTER `good_at`;

-- 报价信息（敏感，仅讲师+客服可见）
ALTER TABLE `user_trainers`
    ADD COLUMN `quote_min`    DECIMAL(10,2) NULL DEFAULT NULL  COMMENT '报价范围-最低'       AFTER `teaching_style`,
    ADD COLUMN `quote_max`    DECIMAL(10,2) NULL DEFAULT NULL  COMMENT '报价范围-最高'       AFTER `quote_min`,
    ADD COLUMN `quote_unit`   VARCHAR(20)   NULL DEFAULT '天'  COMMENT '报价单位：天/次/小时' AFTER `quote_max`,
    ADD COLUMN `quote_remark` VARCHAR(500)  NULL DEFAULT ''    COMMENT '报价备注'            AFTER `quote_unit`;

-- 平台信息
ALTER TABLE `user_trainers`
    ADD COLUMN `background_image`    VARCHAR(500) NULL DEFAULT ''  COMMENT '主页背景图 URL'     AFTER `quote_remark`,
    ADD COLUMN `cert_level`          TINYINT      NOT NULL DEFAULT 0 COMMENT '认证等级：0=未认证，1=基础，2=高级，3=专家' AFTER `background_image`,
    ADD COLUMN `status`              TINYINT      NOT NULL DEFAULT 0 COMMENT '状态：0=草稿，1=待审核，2=审核通过，3=驳回，4=禁用' AFTER `cert_level`,
    ADD COLUMN `reject_reason`       VARCHAR(500) NULL DEFAULT ''  COMMENT '审核驳回原因'       AFTER `status`,
    ADD COLUMN `is_signed`           TINYINT      NOT NULL DEFAULT 0 COMMENT '是否签约讲师'     AFTER `reject_reason`,
    ADD COLUMN `is_trusted`          TINYINT      NOT NULL DEFAULT 0 COMMENT '是否信得过专家'   AFTER `is_signed`,
    ADD COLUMN `is_recommended`      TINYINT      NOT NULL DEFAULT 0 COMMENT '是否推荐讲师'     AFTER `is_trusted`,
    ADD COLUMN `has_copyright_course` TINYINT     NOT NULL DEFAULT 0 COMMENT '是否拥有版权课'   AFTER `is_recommended`;

-- 统计字段
ALTER TABLE `user_trainers`
    ADD COLUMN `exposure_weight`     INT          NOT NULL DEFAULT 0    COMMENT '曝光权重'       AFTER `has_copyright_course`,
    ADD COLUMN `sort_order`          INT          NOT NULL DEFAULT 0    COMMENT '自定义排序'     AFTER `exposure_weight`,
    ADD COLUMN `score`               DECIMAL(3,2) NOT NULL DEFAULT 0.00 COMMENT '综合评分'       AFTER `sort_order`,
    ADD COLUMN `view_count`          INT          NOT NULL DEFAULT 0    COMMENT '累计曝光量'     AFTER `score`,
    ADD COLUMN `consultation_count`  INT          NOT NULL DEFAULT 0    COMMENT '累计咨询量'     AFTER `view_count`,
    ADD COLUMN `comment_count`       INT          NOT NULL DEFAULT 0    COMMENT '累计评论数'     AFTER `consultation_count`;

-- 时间字段
ALTER TABLE `user_trainers`
    ADD COLUMN `draft_expired_at` DATETIME NULL DEFAULT NULL COMMENT '草稿过期时间'   AFTER `comment_count`,
    ADD COLUMN `approved_at`      DATETIME NULL DEFAULT NULL COMMENT '审核通过时间'   AFTER `draft_expired_at`;

-- 移除旧字段（教育拆到子表，homepage_config/contact_preference 由新字段替代）
ALTER TABLE `user_trainers`
    DROP COLUMN `education`,
    DROP COLUMN `homepage_config`,
    DROP COLUMN `contact_preference`;

-- 索引
ALTER TABLE `user_trainers`
    ADD INDEX `idx_status`           (`status`),
    ADD INDEX `idx_cert_level`       (`cert_level`),
    ADD INDEX `idx_province_city`    (`province_id`, `city_id`),
    ADD INDEX `idx_exposure_weight`  (`exposure_weight`),
    ADD INDEX `idx_sort_order`       (`sort_order`),
    ADD INDEX `idx_score`            (`score`),
    ADD INDEX `idx_draft_expired`    (`draft_expired_at`);


-- ------------------------------------------------------------
-- 2. trainer_educations — 教育经历
-- ------------------------------------------------------------
CREATE TABLE `trainer_educations` (
    `id`            INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `trainer_id`    INT          NOT NULL                 COMMENT '关联 user_trainers.id',
    `school_name`   VARCHAR(200) NOT NULL                 COMMENT '学校名称',
    `major`         VARCHAR(100) NULL     DEFAULT ''      COMMENT '所学专业',
    `degree`        VARCHAR(50)  NULL     DEFAULT ''      COMMENT '学历/学位',
    `start_date`    DATE         NOT NULL                 COMMENT '入学日期',
    `end_date`      DATE         NULL     DEFAULT NULL    COMMENT '毕业日期（NULL=在读）',
    `is_graduated`  TINYINT      NOT NULL DEFAULT 1       COMMENT '是否毕业：0=否，1=是',
    `sort_order`    INT          NOT NULL DEFAULT 0       COMMENT '排序值',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_trainer_id` (`trainer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家教育经历表';


-- ------------------------------------------------------------
-- 3. trainer_work_experiences — 工作经历
-- ------------------------------------------------------------
CREATE TABLE `trainer_work_experiences` (
    `id`              INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `trainer_id`      INT          NOT NULL                 COMMENT '关联 user_trainers.id',
    `company_name`    VARCHAR(200) NOT NULL                 COMMENT '单位名称',
    `position`        VARCHAR(100) NULL     DEFAULT ''      COMMENT '职务',
    `start_date`      DATE         NOT NULL                 COMMENT '开始日期',
    `end_date`        DATE         NULL     DEFAULT NULL    COMMENT '结束日期（NULL=至今）',
    `job_description` TEXT         NULL                     COMMENT '工作描述',
    `sort_order`      INT          NOT NULL DEFAULT 0       COMMENT '排序值',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_trainer_id` (`trainer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家工作经历表';


-- ------------------------------------------------------------
-- 4. trainer_honors — 荣誉资质
-- ------------------------------------------------------------
CREATE TABLE `trainer_honors` (
    `id`                INT          NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `trainer_id`        INT          NOT NULL                 COMMENT '关联 user_trainers.id',
    `honor_name`        VARCHAR(200) NOT NULL                 COMMENT '荣誉名称',
    `honor_image`       VARCHAR(500) NULL     DEFAULT ''      COMMENT '荣誉证书/图片 URL',
    `issuing_authority` VARCHAR(200) NULL     DEFAULT ''      COMMENT '颁发机构',
    `issued_at`         DATE         NULL     DEFAULT NULL    COMMENT '获得日期',
    `description`       TEXT         NULL                     COMMENT '荣誉描述',
    `sort_order`        INT          NOT NULL DEFAULT 0       COMMENT '排序值',
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_trainer_id` (`trainer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家荣誉资质表';


-- ------------------------------------------------------------
-- 5. trainer_categories — 培训领域分类关联
-- ------------------------------------------------------------
CREATE TABLE `trainer_categories` (
    `id`          INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `trainer_id`  INT      NOT NULL                 COMMENT '关联 user_trainers.id',
    `category_id` INT      NOT NULL                 COMMENT '培训领域分类 ID',
    `sort_order`  INT      NOT NULL DEFAULT 0       COMMENT '排序值',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_trainer_id`  (`trainer_id`),
    INDEX `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家培训领域分类关联表';
