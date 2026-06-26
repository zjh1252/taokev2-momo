-- 培训宝视频包：groups 承载专题+系列课树，扩展 PXB 展示字段（labels 保持 V86 仅 id+name）
-- 幂等：列已存在则跳过

DROP PROCEDURE IF EXISTS v130_extend_video_package_groups;

DELIMITER $$
CREATE PROCEDURE v130_extend_video_package_groups()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'type'
    ) THEN
        ALTER TABLE video_package_groups
            ADD COLUMN type TINYINT NOT NULL DEFAULT 0 COMMENT '0=通用 1=行业畅销（老站 topic_item.type）' AFTER video_count;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'serial_index'
    ) THEN
        ALTER TABLE video_package_groups
            ADD COLUMN serial_index TINYINT NOT NULL DEFAULT 0 COMMENT '推荐顺序（老站 serial_index）' AFTER type;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'item_index'
    ) THEN
        ALTER TABLE video_package_groups
            ADD COLUMN item_index TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序（老站 item_index）' AFTER serial_index;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'package_code'
    ) THEN
        ALTER TABLE video_package_groups
            ADD COLUMN package_code VARCHAR(50) NOT NULL DEFAULT '' COMMENT '老站 package 字段' AFTER item_index;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'descr'
    ) THEN
        ALTER TABLE video_package_groups
            ADD COLUMN descr TEXT NULL COMMENT '分类介绍' AFTER package_code;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'cover'
    ) THEN
        ALTER TABLE video_package_groups
            ADD COLUMN cover VARCHAR(255) NULL COMMENT '类别封面' AFTER descr;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND index_name = 'idx_video_package_groups_tree'
    ) THEN
        CREATE INDEX idx_video_package_groups_tree
            ON video_package_groups (type, serial_index, item_index);
    END IF;
END$$
DELIMITER ;

CALL v130_extend_video_package_groups();
DROP PROCEDURE IF EXISTS v130_extend_video_package_groups;
