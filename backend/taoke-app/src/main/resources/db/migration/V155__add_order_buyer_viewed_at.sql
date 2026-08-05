SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'buyer_viewed_at') = 0,
        'ALTER TABLE orders ADD COLUMN buyer_viewed_at DATETIME NULL COMMENT ''买家最后查看订单分类提醒时间'' AFTER expired_at',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'buyer_viewed_status') = 0,
        'ALTER TABLE orders ADD COLUMN buyer_viewed_status VARCHAR(32) NULL COMMENT ''买家最后查看时的前台展示分类'' AFTER buyer_viewed_at',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE orders
SET buyer_viewed_at = COALESCE(updated_at, created_at, NOW()),
    buyer_viewed_status = CASE
        WHEN status = 0 AND expired_at IS NOT NULL AND expired_at <= NOW() THEN 'PAYMENT_EXPIRED'
        WHEN status = 0 THEN 'PENDING'
        WHEN status = 1 AND valid_until IS NOT NULL AND valid_until <= NOW() THEN 'COURSE_EXPIRED'
        WHEN status = 1 AND valid_until IS NULL AND paid_at IS NOT NULL AND paid_at <= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN 'COURSE_EXPIRED'
        WHEN status = 1 THEN 'PAID'
        WHEN status = 4 THEN 'PAYMENT_EXPIRED'
        ELSE 'CANCELLED'
    END
WHERE buyer_viewed_at IS NULL;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_user_viewed') = 0,
        'CREATE INDEX idx_orders_user_viewed ON orders (user_id, buyer_viewed_status, buyer_viewed_at)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
