-- 培训宝 legacy：订单扩展字段（generateOrder / getOrders）
-- 可重复执行；若 V111 未实际落库，本脚本一并补 pxb_root_id

DROP PROCEDURE IF EXISTS v113_extend_orders_for_pxb;

DELIMITER $$
CREATE PROCEDURE v113_extend_orders_for_pxb()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'pxb_root_id'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN pxb_root_id INT NOT NULL DEFAULT 0 COMMENT '培训宝 root_company_id，0=不限组织';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'pxb_kefu'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN pxb_kefu VARCHAR(64) NOT NULL DEFAULT '' COMMENT '培训宝客服标识';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'pxb_remarks'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN pxb_remarks VARCHAR(500) NOT NULL DEFAULT '' COMMENT '培训宝订单备注';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'concurrency'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN concurrency INT NOT NULL DEFAULT 1 COMMENT '同时观看人数';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'copy_root_id'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN copy_root_id INT NOT NULL DEFAULT 0 COMMENT '自动排课模板账号 root_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'order_subject'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN order_subject VARCHAR(200) NOT NULL DEFAULT '' COMMENT '订单主题（培训宝客服下单）';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'valid_from'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN valid_from DATETIME NULL COMMENT '服务开始时间（老站 starttime）';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'valid_until'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN valid_until DATETIME NULL COMMENT '服务结束时间（老站 endtime）';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'legacy_status'
    ) THEN
        ALTER TABLE orders
            ADD COLUMN legacy_status TINYINT NULL COMMENT '老站 video_order.status 快照：3=已支付 -1=过期';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_pxb_root_id'
    ) THEN
        CREATE INDEX idx_orders_pxb_root_id ON orders (pxb_root_id, status);
    END IF;
END$$
DELIMITER ;

CALL v113_extend_orders_for_pxb();
DROP PROCEDURE IF EXISTS v113_extend_orders_for_pxb;
