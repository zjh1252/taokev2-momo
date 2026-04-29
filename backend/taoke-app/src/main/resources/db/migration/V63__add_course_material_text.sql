-- ==============================================================
-- V63: courses 增加 material_text 列
--   保存「AI 解析课程资料」上传文档抽取出的全文，用于 AI 重跑或后续分析
-- ==============================================================

ALTER TABLE courses
    ADD COLUMN material_text LONGTEXT NULL COMMENT '课程资料抽取后的全文（用于 AI 解析与重跑）' AFTER material_url;
