-- 扩展运营素材库：区分封面/头像、场景、默认标记、使用次数
ALTER TABLE ops_materials
    ADD COLUMN material_type VARCHAR(32)  NOT NULL DEFAULT 'COVER' COMMENT '素材类型：COVER课程封面/AVATAR头像' AFTER id,
    ADD COLUMN scene          VARCHAR(32)  NOT NULL DEFAULT 'GENERAL' COMMENT '适用场景' AFTER category,
    ADD COLUMN is_default     TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否平台默认素材' AFTER enabled,
    ADD COLUMN usage_count    INT          NOT NULL DEFAULT 0 COMMENT '用户选用次数' AFTER is_default;

UPDATE ops_materials SET material_type = 'COVER', category = '其它' WHERE category = 'cover';

ALTER TABLE ops_materials
    ADD KEY idx_ops_material_type (material_type),
    ADD KEY idx_ops_material_is_default (is_default);
