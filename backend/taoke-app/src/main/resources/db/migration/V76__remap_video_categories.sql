-- V76: remap legacy video categories when legacy video source tables are available.

SET @legacy_video_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_video'
);
SET @legacy_cate_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_cate'
);

SET @sql := IF(@legacy_video_ok > 0 AND @legacy_cate_ok > 0,
'UPDATE videos v
INNER JOIN taoke.tk_video tv ON tv.id = v.id
INNER JOIN taoke.tk_cate tc ON tc.id = CAST(
    REGEXP_SUBSTR(REPLACE(COALESCE(tv.subcid, ''''), '',,'', '',''), ''[0-9]+'') AS UNSIGNED
)
INNER JOIN taoke.tk_cate tl1 ON tl1.id = CASE WHEN COALESCE(tc.sub, 0) > 0 THEN tc.sub ELSE tc.id END
INNER JOIN sys_categories sc
    ON sc.type = ''VIDEO_COURSE''
   AND sc.level = 1
   AND TRIM(sc.name) = TRIM(tl1.name)
SET v.category_id = sc.id,
    v.sub_category_id = 0
WHERE v.status = 2
  AND REGEXP_SUBSTR(REPLACE(COALESCE(tv.subcid, ''''), '',,'', '',''), ''[0-9]+'') IS NOT NULL',
'SELECT 1 AS flyway_v76_skip_video_category_remap');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@legacy_video_ok > 0,
'UPDATE videos v
INNER JOIN taoke.tk_video tv ON tv.id = v.id
SET v.category_id = (
    SELECT sc.id FROM sys_categories sc
    WHERE sc.type = ''VIDEO_COURSE'' AND sc.name = ''其它'' LIMIT 1
),
    v.sub_category_id = 0
WHERE v.status = 2
  AND v.category_id = 0
  AND REGEXP_SUBSTR(REPLACE(COALESCE(tv.subcid, ''''), '',,'', '',''), ''[0-9]+'') IS NOT NULL',
'SELECT 1 AS flyway_v76_skip_video_category_fallback');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
