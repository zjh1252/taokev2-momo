-- V24: 字段类型规范化
-- 1. 布尔字段：is_anonymous → anonymous，TINYINT(1)
ALTER TABLE training_reviews CHANGE COLUMN is_anonymous anonymous TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否匿名';

-- 2. 小整型字段：裸 TINYINT → TINYINT(2)，与布尔 TINYINT(1) 区分
ALTER TABLE training_reviews MODIFY COLUMN rating_content TINYINT(2) NOT NULL DEFAULT 0 COMMENT '授课内容评分 1-5';
ALTER TABLE training_reviews MODIFY COLUMN rating_teaching TINYINT(2) NOT NULL DEFAULT 0 COMMENT '授课水平评分 1-5';
ALTER TABLE training_reviews MODIFY COLUMN rating_service TINYINT(2) NOT NULL DEFAULT 0 COMMENT '服务态度评分 1-5';
ALTER TABLE training_reviews MODIFY COLUMN status TINYINT(2) NOT NULL DEFAULT 0 COMMENT '0=待审核 1=通过 -1=驳回 2=隐藏';

ALTER TABLE trainer_lead_messages MODIFY COLUMN status TINYINT(2) NOT NULL DEFAULT 0 COMMENT '0=新建 1=已分配 2=已处理';
