-- 推荐资源位：管理首页/列表页/详情页各板块的推荐内容与排序
CREATE TABLE IF NOT EXISTS `recommended_resources` (
    `id`              INT          NOT NULL AUTO_INCREMENT,
    `slot_code`       VARCHAR(50)  NOT NULL COMMENT '推荐位编码',
    `resource_type`   VARCHAR(20)  NOT NULL COMMENT 'TRAINER/COURSE/CASE/INSTITUTION',
    `resource_id`     INT          NOT NULL COMMENT '资源主键',
    `category_id`     INT          NULL     COMMENT '擅长领域分类 ID（仅 TRAINER_CATEGORY_EXPERT 位）',
    `role_type`       VARCHAR(20)  NOT NULL DEFAULT 'PRIMARY' COMMENT 'PRIMARY=正式推荐 BACKUP=备选',
    `sort_order`      INT          NOT NULL DEFAULT 0 COMMENT '排序值，越大越靠前',
    `cover_url`       VARCHAR(512) NULL     COMMENT '推荐封面（运营可覆盖）',
    `title`           VARCHAR(200) NULL     COMMENT '定位/头衔（首席专家等）',
    `description`     TEXT         NULL     COMMENT '推荐描述（运营可覆盖）',
    `expertise_override` VARCHAR(200) NULL  COMMENT '擅长领域展示覆盖',
    `key_tags`        VARCHAR(200) NULL     COMMENT '关键标签展示覆盖',
    `admin_note`      VARCHAR(500) NULL     COMMENT '运营备注',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_slot_resource` (`slot_code`, `resource_type`, `resource_id`, `category_id`, `role_type`),
    KEY `idx_slot_category_sort` (`slot_code`, `category_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐资源位配置';
