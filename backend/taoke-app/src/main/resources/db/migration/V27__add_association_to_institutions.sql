-- 机构表新增"培训协会"标识字段
ALTER TABLE user_institutions ADD COLUMN association TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否培训协会';
