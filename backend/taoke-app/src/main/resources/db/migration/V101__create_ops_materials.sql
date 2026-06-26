-- 运营素材库（课程封面等运营图片）
CREATE TABLE ops_materials (
    id          INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(128)    NOT NULL DEFAULT ''     COMMENT '素材名称',
    url         VARCHAR(512)    NOT NULL                COMMENT '图片 URL',
    category    VARCHAR(64)     NOT NULL DEFAULT 'cover' COMMENT '分类：cover/general 等',
    enabled     TINYINT(1)      NOT NULL DEFAULT 1      COMMENT '是否启用',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_ops_material_category (category),
    KEY idx_ops_material_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运营素材库';
