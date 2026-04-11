-- 敏感词表
CREATE TABLE `sys_sensitive_words` (
    `id`          INT          NOT NULL AUTO_INCREMENT,
    `word`        VARCHAR(100) NOT NULL COMMENT '敏感词内容',
    `category`    TINYINT(2)   NOT NULL DEFAULT 5 COMMENT '分类：1=政治敏感, 2=色情低俗, 3=暴力, 4=广告, 5=其他',
    `replacement` VARCHAR(100) NOT NULL DEFAULT '***' COMMENT '替换文本',
    `enabled`     TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否启用：0=禁用, 1=启用',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_word` (`word`),
    KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词表';
