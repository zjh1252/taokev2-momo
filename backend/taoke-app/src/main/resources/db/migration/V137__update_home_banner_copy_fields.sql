-- 首页轮播图默认文案：顶部小字、H1 标题、底部描述均可在后台轮播图管理中覆盖
UPDATE `recommended_resources`
SET
    `resource_type` = 'BANNER',
    `chief_intro` = '淘课网 2026 年度专题',
    `title` = '找得到、信得过、价更优、+AI',
    `description` = '汇聚全球 5000+ 顶尖商学院专家，为您的企业量身定制成长路径',
    `cover_url` = CASE
        WHEN `cover_url` IS NULL OR TRIM(`cover_url`) = ''
            THEN '/statics/images/hero-banner.jpg'
        ELSE `cover_url`
    END
WHERE `slot_code` = 'HOME_BANNER'
  AND `resource_type` = 'BANNER'
  AND `resource_id` IN (1, 2, 3)
  AND `role_type` = 'PRIMARY';
