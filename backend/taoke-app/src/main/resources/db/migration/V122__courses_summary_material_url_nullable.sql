-- ==============================================================
-- V72: 课程发布表单下线「课程简介」「课程资料」字段后，
--      将对应列改为允许 NULL，避免新建课程时因列 NOT NULL 报错。
-- 关联：courses.summary / courses.material_url
-- ==============================================================

ALTER TABLE courses
    MODIFY COLUMN summary      VARCHAR(500) NULL DEFAULT NULL COMMENT '课程简介（短文本，前端已下线，可空）',
    MODIFY COLUMN material_url VARCHAR(500) NULL DEFAULT NULL COMMENT '课程资料文件 URL（前端已下线，可空）';
