-- 首页轮播图：新增两个按钮图片 URL 字段，并写入 banner改 默认素材
ALTER TABLE `recommended_resources`
    ADD COLUMN `consult_button_image_url` VARCHAR(512) NULL COMMENT '立即咨询按钮图' AFTER `cover_url`,
    ADD COLUMN `topic_button_image_url` VARCHAR(512) NULL COMMENT '查看专题按钮图' AFTER `consult_button_image_url`;

UPDATE `recommended_resources`
SET
    `cover_url` = CASE `resource_id`
        WHEN 1 THEN '/statics/images/banner改/无按钮/Frame 26.png'
        WHEN 2 THEN '/statics/images/banner改/无按钮/Frame 28.png'
        WHEN 3 THEN '/statics/images/banner改/无按钮/Frame 30.png'
        ELSE `cover_url`
    END,
    `consult_button_image_url` = CASE `resource_id`
        WHEN 1 THEN '/statics/images/banner改/按钮/橙色/Frame 28.png'
        WHEN 2 THEN '/statics/images/banner改/按钮/紫色/紫1.png'
        WHEN 3 THEN '/statics/images/banner改/按钮/蓝色/蓝1.png'
        ELSE `consult_button_image_url`
    END,
    `topic_button_image_url` = CASE `resource_id`
        WHEN 1 THEN '/statics/images/banner改/按钮/橙色/Frame 29.png'
        WHEN 2 THEN '/statics/images/banner改/按钮/紫色/紫2.png'
        WHEN 3 THEN '/statics/images/banner改/按钮/蓝色/蓝2.png'
        ELSE `topic_button_image_url`
    END
WHERE `slot_code` = 'HOME_BANNER'
  AND `resource_type` = 'BANNER'
  AND `resource_id` IN (1, 2, 3)
  AND `role_type` = 'PRIMARY';
