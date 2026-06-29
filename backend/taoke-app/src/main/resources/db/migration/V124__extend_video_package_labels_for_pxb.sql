-- ??? legacy?video_package_labels ???? tk_video_topic_item ????
-- ?????

DROP PROCEDURE IF EXISTS v112_extend_video_package_labels;

DELIMITER $$
CREATE PROCEDURE v112_extend_video_package_labels()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN topic_id INT NOT NULL DEFAULT 0 COMMENT '?? topic_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'item_parent'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN item_parent INT NOT NULL DEFAULT 0 COMMENT '?? item_parent';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'item_index'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN item_index TINYINT NOT NULL DEFAULT 0 COMMENT '?? item_index ??';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'type'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN type TINYINT NOT NULL DEFAULT 0 COMMENT '0=?? 1=????';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'serial_index'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN serial_index TINYINT NOT NULL DEFAULT 0 COMMENT '?? serial_index';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'price'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN price INT NOT NULL DEFAULT 0 COMMENT '?????????';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'company_price'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN company_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '?????';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'disabled'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN disabled TINYINT NOT NULL DEFAULT 0 COMMENT '1=???';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_name'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN topic_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT '????';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'package_code'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN package_code VARCHAR(50) NOT NULL DEFAULT '' COMMENT '?? package ??';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'descr'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN descr TEXT NULL COMMENT '????';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'cover'
    ) THEN
        ALTER TABLE video_package_labels ADD COLUMN cover VARCHAR(255) NULL COMMENT '????';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND index_name = 'idx_video_package_labels_tree'
    ) THEN
        CREATE INDEX idx_video_package_labels_tree ON video_package_labels (disabled, type, serial_index, item_index);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND index_name = 'idx_video_package_labels_parent'
    ) THEN
        CREATE INDEX idx_video_package_labels_parent ON video_package_labels (item_parent, id);
    END IF;
END$$
DELIMITER ;

CALL v112_extend_video_package_labels();
DROP PROCEDURE IF EXISTS v112_extend_video_package_labels;
