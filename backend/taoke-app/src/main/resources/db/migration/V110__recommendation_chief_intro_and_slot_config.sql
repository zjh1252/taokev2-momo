-- 推荐位：首席简介 + 首页大卡固定开关
ALTER TABLE `recommended_resources`
    ADD COLUMN `chief_intro` TEXT NULL COMMENT '首席简介（运营可覆盖）' AFTER `description`;

CREATE TABLE IF NOT EXISTS `recommendation_slot_configs` (
    `slot_code`   VARCHAR(50) NOT NULL COMMENT '推荐位编码',
    `lock_main`   TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '首页左侧大卡是否固定展示',
    `lock_middle` TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '首页中间大卡是否固定展示',
    `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`slot_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐位布局配置';

INSERT INTO `recommendation_slot_configs` (`slot_code`, `lock_main`, `lock_middle`)
VALUES ('HOME_TRAINER', 1, 1)
ON DUPLICATE KEY UPDATE `slot_code` = `slot_code`;
