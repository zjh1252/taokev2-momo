-- 课程增加 has_plan 字段，标识是否启用公开课计划
ALTER TABLE courses ADD COLUMN has_plan tinyint NOT NULL DEFAULT 0 COMMENT '是否有公开课计划：0=否 1=是' AFTER is_free;

-- 历史数据：已有公开课类型的课程自动标记 has_plan=1
UPDATE courses SET has_plan = 1 WHERE type IN ('OPEN_OFFLINE', 'OPEN_ONLINE');
