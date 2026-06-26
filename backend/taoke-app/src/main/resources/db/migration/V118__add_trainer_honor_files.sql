-- 专家「荣誉与资质」文件附件列：JSON 数组，元素形如 {"name":"xxx.pdf","url":"https://..."}
-- 仅作文件上传展示用，与专业认证 certification_files 隔离
ALTER TABLE user_trainers
    ADD COLUMN honor_files JSON NULL
        COMMENT '荣誉与资质文件 JSON 数组 [{name,url}]'
    AFTER certification_files;
