-- 需求表：增加联系人、联系电话、3级地区字段
ALTER TABLE demands
    ADD COLUMN contact_name  VARCHAR(50)  NULL COMMENT '联系人' AFTER source_course_id,
    ADD COLUMN contact_phone VARCHAR(30)  NULL COMMENT '联系电话' AFTER contact_name,
    ADD COLUMN province_id   INT          NULL COMMENT '省份 ID，关联 common_regions.id' AFTER contact_phone,
    ADD COLUMN city_id       INT          NULL COMMENT '城市 ID，关联 common_regions.id' AFTER province_id,
    ADD COLUMN district_id   INT          NULL COMMENT '区/县 ID，关联 common_regions.id' AFTER city_id;
