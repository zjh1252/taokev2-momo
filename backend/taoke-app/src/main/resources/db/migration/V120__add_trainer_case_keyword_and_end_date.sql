-- ============================================================
-- 案例字段扩展：关键字 + 培训结束日期（培训日期段起止）
-- 关联：user_trainer_cases
-- status 新增取值 3=草稿（沿用既有 tinyint(2)，无需改列）
-- ============================================================

ALTER TABLE user_trainer_cases
    ADD COLUMN keyword VARCHAR(200) NULL COMMENT '关键字（逗号分隔）' AFTER training_topic,
    ADD COLUMN training_end_date DATE NULL COMMENT '培训结束日期（training_date 为起始日）' AFTER training_date;
