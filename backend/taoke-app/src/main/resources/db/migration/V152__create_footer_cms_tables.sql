-- 首页底部栏 CMS：静态页、链接项、全局配置

CREATE TABLE IF NOT EXISTS `static_pages` (
    `id`           INT          NOT NULL AUTO_INCREMENT,
    `page_code`    VARCHAR(50)  NOT NULL COMMENT '页面编码',
    `title`        VARCHAR(200) NOT NULL COMMENT '页面标题',
    `content`      LONGTEXT              COMMENT '富文本内容',
    `published`    TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否发布',
    `version`      INT          NOT NULL DEFAULT 1 COMMENT '版本号',
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_page_code` (`page_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='静态页面';

CREATE TABLE IF NOT EXISTS `footer_links` (
    `id`               INT          NOT NULL AUTO_INCREMENT,
    `section_code`     VARCHAR(30)  NOT NULL COMMENT '分区：NAV/ABOUT/BUSINESS/LEGAL/CONTACT',
    `item_code`        VARCHAR(50)  NOT NULL COMMENT '条目编码',
    `label`            VARCHAR(100) NOT NULL COMMENT '展示文案',
    `link_type`        VARCHAR(20)  NOT NULL COMMENT 'INTERNAL/STATIC_PAGE/EXTERNAL/NONE',
    `link_target`      VARCHAR(500)          COMMENT '路由、page_code 或外链',
    `icon_key`         VARCHAR(30)           COMMENT '社交图标标识',
    `qr_image_url`     VARCHAR(500)          COMMENT '条目级二维码',
    `sort_order`       INT          NOT NULL DEFAULT 0,
    `enabled`          TINYINT(1)   NOT NULL DEFAULT 1,
    `open_in_new_tab`  TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_item_code` (`item_code`),
    KEY `idx_section_sort` (`section_code`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='底部链接项';

CREATE TABLE IF NOT EXISTS `footer_config` (
    `id`                      INT          NOT NULL DEFAULT 1,
    `brand_tagline`           VARCHAR(200) NOT NULL DEFAULT '领先的企业培训采购平台',
    `company_intro`           TEXT                  COMMENT '公司简介',
    `phone`                   VARCHAR(50)  NOT NULL DEFAULT '400-169-7929',
    `main_qr_image_url`       VARCHAR(500)          COMMENT '主二维码',
    `copyright_text`          VARCHAR(500) NOT NULL DEFAULT '',
    `company_copyright_text`  VARCHAR(200) NOT NULL DEFAULT '上海淘课企业管理咨询有限公司 版权所有',
    `company_copyright_url`   VARCHAR(500)          COMMENT '版权链接',
    `icp_text`                VARCHAR(200) NOT NULL DEFAULT '沪ICP备05034964号',
    `created_at`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='底部全局配置';

INSERT INTO `footer_config` (`id`, `brand_tagline`, `company_intro`, `phone`, `copyright_text`,
    `company_copyright_text`, `icp_text`)
SELECT 1,
    '领先的企业培训采购平台',
    '淘课网联合全国数万优秀培训师和培训机构,给企业提供有针对性的、互动的、积聚人脉的管理培训服务.包括提供培训需求诊断、培训课程采购、培训资料下载等服务！',
    '400-169-7929',
    'Copyright(C) 2006-2024 ' || 'TAOKE' || CHAR(46) || 'com All Rights Reserved.',
    '上海淘课企业管理咨询有限公司 版权所有',
    '沪ICP备05034964号'
WHERE NOT EXISTS (SELECT 1 FROM `footer_config` WHERE `id` = 1);

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'HAPPY_TRAINING_JOURNAL', '《快乐培训》期刊', '<p>《快乐培训》期刊内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'HAPPY_TRAINING_JOURNAL');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'DISC_ASSESSMENT', 'DISC性格测评', '<p>DISC性格测评服务介绍筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'DISC_ASSESSMENT');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'HELP', '使用帮助', '<p>使用帮助内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'HELP');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'SITEMAP', '站点地图', '<p>站点地图筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'SITEMAP');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'ABOUT_TAOKE', '关于淘课', '<p>关于淘课内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'ABOUT_TAOKE');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'CONTACT_US', '联系我们', '<p>联系我们内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'CONTACT_US');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'CAREERS', '招聘英才', '<p>招聘英才内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'CAREERS');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'BUSINESS_COOPERATION', '商务合作', '<p>商务合作内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'BUSINESS_COOPERATION');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'AD_SERVICE', '广告服务', '<p>广告服务内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'AD_SERVICE');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'TERMS_OF_SERVICE', '服务条款', '<p>服务条款内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'TERMS_OF_SERVICE');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'LEGAL_NOTICE', '法律声明', '<p>法律声明内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'LEGAL_NOTICE');

INSERT INTO `static_pages` (`page_code`, `title`, `content`, `published`, `version`)
SELECT 'PRIVACY_POLICY', '隐私保护', '<p>隐私保护内容筹备中，敬请期待。</p>', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `static_pages` WHERE `page_code` = 'PRIVACY_POLICY');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'NAV', 'HOME', '淘课网首页', 'INTERNAL', '/', 60, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'HOME');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'NAV', 'ENCYCLOPEDIA', '淘课百科', 'INTERNAL', '/articles', 50, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'ENCYCLOPEDIA');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'NAV', 'HAPPY_TRAINING_JOURNAL', '《快乐培训》期刊', 'STATIC_PAGE', 'HAPPY_TRAINING_JOURNAL', 40, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'HAPPY_TRAINING_JOURNAL');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'NAV', 'DISC_ASSESSMENT', 'DISC性格测评', 'STATIC_PAGE', 'DISC_ASSESSMENT', 30, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'DISC_ASSESSMENT');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'NAV', 'HELP', '使用帮助', 'STATIC_PAGE', 'HELP', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'HELP');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'NAV', 'SITEMAP', '站点地图', 'STATIC_PAGE', 'SITEMAP', 10, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'SITEMAP');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'ABOUT', 'ABOUT_TAOKE', '关于淘课', 'STATIC_PAGE', 'ABOUT_TAOKE', 30, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'ABOUT_TAOKE');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'ABOUT', 'CONTACT_US', '联系我们', 'STATIC_PAGE', 'CONTACT_US', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'CONTACT_US');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'ABOUT', 'CAREERS', '招聘英才', 'STATIC_PAGE', 'CAREERS', 10, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'CAREERS');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'BUSINESS', 'BUSINESS_COOPERATION', '商务合作', 'STATIC_PAGE', 'BUSINESS_COOPERATION', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'BUSINESS_COOPERATION');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'BUSINESS', 'AD_SERVICE', '广告服务', 'STATIC_PAGE', 'AD_SERVICE', 10, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'AD_SERVICE');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'LEGAL', 'TERMS_OF_SERVICE', '服务条款', 'STATIC_PAGE', 'TERMS_OF_SERVICE', 30, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'TERMS_OF_SERVICE');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'LEGAL', 'LEGAL_NOTICE', '法律声明', 'STATIC_PAGE', 'LEGAL_NOTICE', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'LEGAL_NOTICE');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `sort_order`, `enabled`)
SELECT 'LEGAL', 'PRIVACY_POLICY', '隐私保护', 'STATIC_PAGE', 'PRIVACY_POLICY', 10, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'PRIVACY_POLICY');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `icon_key`, `sort_order`, `enabled`)
SELECT 'CONTACT', 'WECHAT', '微信公众号', 'NONE', NULL, 'wechat', 30, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'WECHAT');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `icon_key`, `sort_order`, `enabled`)
SELECT 'CONTACT', 'DOUYIN', '官方抖音号', 'NONE', NULL, 'douyin', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'DOUYIN');

INSERT INTO `footer_links` (`section_code`, `item_code`, `label`, `link_type`, `link_target`, `icon_key`, `sort_order`, `enabled`)
SELECT 'CONTACT', 'XIAOHONGSHU', '官方小红书', 'NONE', NULL, 'xiaohongshu', 10, 1
WHERE NOT EXISTS (SELECT 1 FROM `footer_links` WHERE `item_code` = 'XIAOHONGSHU');
