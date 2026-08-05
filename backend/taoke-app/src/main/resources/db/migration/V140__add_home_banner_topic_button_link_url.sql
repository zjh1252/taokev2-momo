-- 首页轮播图：查看专题按钮跳转地址
ALTER TABLE `recommended_resources`
    ADD COLUMN `topic_button_link_url` VARCHAR(512) NULL COMMENT '查看专题按钮跳转地址' AFTER `topic_button_image_url`;

UPDATE `recommended_resources`
SET `topic_button_link_url` = '/trainer/field=MBA%2F总裁班.htm'
WHERE `slot_code` = 'HOME_BANNER'
  AND `resource_type` = 'BANNER'
  AND `resource_id` IN (1, 2, 3)
  AND `role_type` = 'PRIMARY'
  AND (`topic_button_link_url` IS NULL OR TRIM(`topic_button_link_url`) = '');
