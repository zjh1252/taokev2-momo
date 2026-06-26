-- ============================================================
-- V44: 扩展专家主表 user_trainers，对齐老站申请表单字段
--
-- 新增列：
--   teaching_name        授课姓名（与原 name=真实姓名 区分展示）
--   one_line_intro       一句话介绍（80 字内简短自我介绍）
--   taoke_price          淘课网售价（元/天）
--   taoke_commission     淘课网合作课酬（元/天）
--   agreement_signed_at  注册专家协议签署时间
--   agreement_version    协议版本（默认 v1）
--   resume_url           最近一次上传简历的 URL（用于 AI 解析）
-- ============================================================

ALTER TABLE `user_trainers`
    ADD COLUMN `teaching_name` VARCHAR(64) NULL DEFAULT NULL COMMENT '授课姓名' AFTER `name`,
    ADD COLUMN `one_line_intro` VARCHAR(255) NULL DEFAULT NULL COMMENT '一句话介绍' AFTER `bio`,
    ADD COLUMN `taoke_price` DECIMAL(10,2) NULL DEFAULT NULL COMMENT '淘课网售价（元）' AFTER `quote_remark`,
    ADD COLUMN `taoke_commission` DECIMAL(10,2) NULL DEFAULT NULL COMMENT '淘课网合作课酬（元）' AFTER `taoke_price`,
    ADD COLUMN `agreement_signed_at` DATETIME NULL DEFAULT NULL COMMENT '注册专家合作协议签署时间' AFTER `taoke_commission`,
    ADD COLUMN `agreement_version` VARCHAR(32) NULL DEFAULT NULL COMMENT '协议版本号，默认 v1' AFTER `agreement_signed_at`,
    ADD COLUMN `resume_url` VARCHAR(512) NULL DEFAULT NULL COMMENT '最近上传的简历文件 URL' AFTER `agreement_version`;
