-- ==============================================================
-- V62: 课程发布表单字段调整
--   1. courses 增加 summary（课程简介，短文本）
--   2. courses 增加 material_url（课程资料文件 URL）
--   3. hours_per_day（每天小时数）语义改为 total_hours（课程总时长）
--      - 先按 duration_days × 旧值回填为「总小时数」
--      - 再 CHANGE COLUMN 改名 + 改注释，列宽扩到 DECIMAL(5,1)
-- ==============================================================

-- 1) 新增字段
ALTER TABLE courses
    ADD COLUMN summary       VARCHAR(500) NOT NULL DEFAULT '' COMMENT '课程简介（短文本）'         AFTER intro,
    ADD COLUMN material_url  VARCHAR(500) NOT NULL DEFAULT '' COMMENT '课程资料文件 URL（doc/docx/pdf）' AFTER syllabus;

-- 2) 历史数据回填：把「每天小时数」转成「课程总小时数」
UPDATE courses
SET hours_per_day = duration_days * hours_per_day
WHERE duration_days > 0;

-- 3) 列改名 + 注释 + 扩宽
ALTER TABLE courses
    CHANGE COLUMN hours_per_day total_hours DECIMAL(5,1) NOT NULL DEFAULT 0.0 COMMENT '课程总时长（小时）';
