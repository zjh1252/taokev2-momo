-- ============================================================
-- 培训需求扩展：培训类型 + 意向专家
-- 关联：demands
-- course_type: PUBLIC=公开课, INTERNAL=内训课
-- ============================================================

ALTER TABLE demands
    ADD COLUMN course_type VARCHAR(20) NULL COMMENT '培训类型：PUBLIC=公开课, INTERNAL=内训课' AFTER format,
    ADD COLUMN intended_trainer VARCHAR(100) NULL COMMENT '意向专家（自由文本，选填）' AFTER course_type;
