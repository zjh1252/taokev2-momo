-- 专家详情页迭代：扩展专家「部分客户」长文本字段，留言增加区/县字段
ALTER TABLE user_trainers
    ADD COLUMN partial_clients TEXT NULL COMMENT '部分客户（长文本，专家详情页对外展示）' AFTER background;

ALTER TABLE trainer_lead_messages
    ADD COLUMN district_id INT NULL COMMENT '区/县 ID，关联 common_regions.id' AFTER city_id;
