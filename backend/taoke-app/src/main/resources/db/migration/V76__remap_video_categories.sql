-- V76：录播课分类 ID 按老库 tk_video.subcid → tk_cate 一级名称对齐 sys_categories(VIDEO_COURSE)
-- 背景：迁移阶段 04_videos.sql 将 category_id 写死为 0，侧栏筛选无效

UPDATE videos v
INNER JOIN taoke.tk_video tv ON tv.id = v.id
INNER JOIN taoke.tk_cate tc ON tc.id = CAST(
    REGEXP_SUBSTR(REPLACE(COALESCE(tv.subcid, ''), ',,', ','), '[0-9]+') AS UNSIGNED
)
INNER JOIN taoke.tk_cate tl1 ON tl1.id = CASE WHEN COALESCE(tc.sub, 0) > 0 THEN tc.sub ELSE tc.id END
INNER JOIN sys_categories sc
    ON sc.type = 'VIDEO_COURSE'
   AND sc.level = 1
   AND TRIM(sc.name) = TRIM(tl1.name)
SET v.category_id = sc.id,
    v.sub_category_id = 0
WHERE v.status = 2
  AND REGEXP_SUBSTR(REPLACE(COALESCE(tv.subcid, ''), ',,', ','), '[0-9]+') IS NOT NULL;

-- 老 tk_cate 一级名不在 VIDEO_COURSE 树中的，归入「其它」
UPDATE videos v
INNER JOIN taoke.tk_video tv ON tv.id = v.id
SET v.category_id = (
    SELECT sc.id FROM sys_categories sc
    WHERE sc.type = 'VIDEO_COURSE' AND sc.name = '其它' LIMIT 1
),
    v.sub_category_id = 0
WHERE v.status = 2
  AND v.category_id = 0
  AND REGEXP_SUBSTR(REPLACE(COALESCE(tv.subcid, ''), ',,', ','), '[0-9]+') IS NOT NULL;
