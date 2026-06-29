-- 培训宝 legacy 集成：订单/报名记录增加 pxb_root_id，对齐老站 tk_video_order.pxb_root_id
-- 可重复执行（列/索引已存在则跳过）

SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'pxb_root_id') = 0,
        'ALTER TABLE orders ADD COLUMN pxb_root_id INT NOT NULL DEFAULT 0 COMMENT ''培训宝 root_company_id，0=不限组织'' AFTER user_id',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_pxb_root_id') = 0,
        'CREATE INDEX idx_orders_pxb_root_id ON orders (pxb_root_id, status)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
