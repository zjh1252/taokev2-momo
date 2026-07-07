-- 首页轮播图推荐位：固定 3 张，后台可上传覆盖
UPDATE `recommended_resources`
SET `resource_type` = 'BANNER'
WHERE `slot_code` = 'HOME_BANNER';

INSERT INTO `recommended_resources`
    (`slot_code`, `resource_type`, `resource_id`, `category_id`, `role_type`,
     `sort_order`, `cover_url`, `title`, `description`, `admin_note`)
SELECT 'HOME_BANNER', 'BANNER', 1, NULL, 'PRIMARY',
       3, '/statics/images/hero-banner.jpg', '淘课网2026年度专题',
       '聚焦企业培训采购、专家资源对接与组织能力提升', '首页轮播图第 1 张'
WHERE NOT EXISTS (
    SELECT 1 FROM `recommended_resources`
    WHERE `slot_code` = 'HOME_BANNER' AND `resource_type` = 'BANNER'
      AND `resource_id` = 1 AND `role_type` = 'PRIMARY'
);

INSERT INTO `recommended_resources`
    (`slot_code`, `resource_type`, `resource_id`, `category_id`, `role_type`,
     `sort_order`, `cover_url`, `title`, `description`, `admin_note`)
SELECT 'HOME_BANNER', 'BANNER', 2, NULL, 'PRIMARY',
       2, '/statics/images/hero-banner.jpg', '淘课网2026年度专题',
       '精选 MBA/总裁班方向专家，匹配管理者成长场景', '首页轮播图第 2 张'
WHERE NOT EXISTS (
    SELECT 1 FROM `recommended_resources`
    WHERE `slot_code` = 'HOME_BANNER' AND `resource_type` = 'BANNER'
      AND `resource_id` = 2 AND `role_type` = 'PRIMARY'
);

INSERT INTO `recommended_resources`
    (`slot_code`, `resource_type`, `resource_id`, `category_id`, `role_type`,
     `sort_order`, `cover_url`, `title`, `description`, `admin_note`)
SELECT 'HOME_BANNER', 'BANNER', 3, NULL, 'PRIMARY',
       1, '/statics/images/hero-banner.jpg', '淘课网2026年度专题',
       '从课程、案例到专家服务，构建更高效的培训采购入口', '首页轮播图第 3 张'
WHERE NOT EXISTS (
    SELECT 1 FROM `recommended_resources`
    WHERE `slot_code` = 'HOME_BANNER' AND `resource_type` = 'BANNER'
      AND `resource_id` = 3 AND `role_type` = 'PRIMARY'
);
