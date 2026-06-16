-- ==============================================================
-- V93: demands 增加 demand_no；允许游客提交（user_id 可空）
-- ==============================================================

DROP PROCEDURE IF EXISTS v93_add_demand_no;

DELIMITER $$
CREATE PROCEDURE v93_add_demand_no()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'demands' AND column_name = 'demand_no'
    ) THEN
        ALTER TABLE demands
            ADD COLUMN demand_no VARCHAR(32) NULL COMMENT '需求单号' AFTER id;
    END IF;
END$$
DELIMITER ;

CALL v93_add_demand_no();
DROP PROCEDURE IF EXISTS v93_add_demand_no;

-- 历史数据回填单号
UPDATE demands SET demand_no = CONCAT('XQ', LPAD(id, 8, '0')) WHERE demand_no IS NULL OR demand_no = '';

ALTER TABLE demands MODIFY COLUMN demand_no VARCHAR(32) NOT NULL COMMENT '需求单号';
CREATE UNIQUE INDEX idx_demands_demand_no ON demands (demand_no);

ALTER TABLE demands MODIFY COLUMN user_id INT NULL COMMENT '提交人用户 ID，游客提交时为空';
