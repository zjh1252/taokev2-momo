-- 专题头 is_open（对齐 tk_video_topic.is_open）；getCourseTopic 仅返回开放专题下的系列课
-- 幂等：列已存在则跳过；同实例有 taoke 库时回填专题头 is_open 并同步系列课 PXB 字段

DROP PROCEDURE IF EXISTS v131_video_package_groups_is_open;

DELIMITER $$
CREATE PROCEDURE v131_video_package_groups_is_open()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups' AND column_name = 'is_open'
    ) THEN
        ALTER TABLE video_package_groups
            ADD COLUMN is_open INT NOT NULL DEFAULT 1
                COMMENT '专题头是否启用（老站 tk_video_topic.is_open）；系列课行可忽略'
            AFTER cover;
    END IF;
END$$
DELIMITER ;

CALL v131_video_package_groups_is_open();
DROP PROCEDURE IF EXISTS v131_video_package_groups_is_open;
