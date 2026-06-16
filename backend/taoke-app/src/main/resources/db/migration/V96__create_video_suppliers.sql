-- 录播课供应商及分类体系
CREATE TABLE video_suppliers (
    id           INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id      INT             NOT NULL                COMMENT '关联用户 ID',
    company_name VARCHAR(200)    NOT NULL DEFAULT ''     COMMENT '公司名称',
    member_type  VARCHAR(30)     NOT NULL DEFAULT 'TRAINING_ORG' COMMENT '会员类型',
    enabled      TINYINT(1)      NOT NULL DEFAULT 1      COMMENT '是否启用',
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_video_suppliers_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课供应商';

CREATE TABLE video_supplier_categories (
    id            INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    supplier_id   INT             NOT NULL                COMMENT '供应商 ID',
    parent_id     INT             NOT NULL DEFAULT 0      COMMENT '父分类 ID，0=顶级',
    name          VARCHAR(150)    NOT NULL DEFAULT ''     COMMENT '分类名称',
    sort_order    INT             NOT NULL DEFAULT 0      COMMENT '排序',
    total_price   DECIMAL(10,2)   NULL                    COMMENT '打包总价',
    discount_rate DECIMAL(5,2)    NOT NULL DEFAULT 100    COMMENT '折扣率（%）',
    enabled       TINYINT(1)      NOT NULL DEFAULT 1      COMMENT '是否启用',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_video_supplier_categories_supplier (supplier_id, parent_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课供应商分类';

CREATE TABLE video_supplier_category_videos (
    id          INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT             NOT NULL                COMMENT '供应商 ID',
    category_id INT             NOT NULL                COMMENT '分类 ID',
    video_id    INT             NOT NULL                COMMENT '录播课 ID',
    sort_order  INT             NOT NULL DEFAULT 0      COMMENT '排序',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_supplier_category_video (category_id, video_id),
    KEY idx_supplier_category_videos_supplier (supplier_id, category_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商分类与录播课关联';

-- 录播课评论审核字段
ALTER TABLE video_comments
    ADD COLUMN audit_status TINYINT(2) NOT NULL DEFAULT 1 COMMENT '0待审核1已通过2已驳回' AFTER rating,
    ADD COLUMN reject_reason VARCHAR(500) NOT NULL DEFAULT '' COMMENT '驳回原因' AFTER audit_status;

UPDATE video_comments SET audit_status = 1 WHERE visible = 1;
UPDATE video_comments SET audit_status = 2 WHERE visible = 0;
