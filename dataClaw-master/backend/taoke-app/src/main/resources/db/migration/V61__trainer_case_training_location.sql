-- ============================================================
-- 案例「培训地点」字段扩展（4 级地区联动 + 详细地址）
-- 关联：user_trainer_cases
-- ============================================================

ALTER TABLE user_trainer_cases
    ADD COLUMN province_id INT NULL COMMENT '培训地点 - 省 ID' AFTER trainee_count,
    ADD COLUMN city_id INT NULL COMMENT '培训地点 - 市 ID' AFTER province_id,
    ADD COLUMN district_id INT NULL COMMENT '培训地点 - 区/县 ID' AFTER city_id,
    ADD COLUMN town_id INT NULL COMMENT '培训地点 - 镇/街道 ID' AFTER district_id,
    ADD COLUMN training_address VARCHAR(255) NULL COMMENT '培训地点 - 详细地址' AFTER town_id;
