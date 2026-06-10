-- 录播课封面 URL 规范化：FSM key、OSS 相对路径、旧站 attachments
-- 排除 cover_url 本即为空的老数据（不在 UPDATE 条件内）

-- videos
UPDATE videos
SET cover_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) REGEXP '^[0-9A-Fa-f]+-[0-9]+$';

UPDATE videos
SET cover_url = CONCAT('https://cdn5-pxb-videos.taoke.com/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'taoke/covers/%';

UPDATE videos
SET cover_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'taoke/upload/%';

UPDATE videos
SET cover_url = CONCAT('https://www.taoke.com', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE '/attachments/%';

UPDATE videos
SET cover_url = CONCAT('https://www.taoke.com/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'attachments/%'
  AND TRIM(cover_url) NOT LIKE 'http%';

UPDATE videos
SET cover_url = REPLACE(cover_url, 'http://', 'https://'),
    updated_at = NOW()
WHERE cover_url LIKE 'http://www.taoke.com%'
   OR cover_url LIKE 'http://taoke.com%'
   OR cover_url LIKE 'http://cdn-static.taoke.com%'
   OR cover_url LIKE 'http://cdn5-pxb-videos.taoke.com%'
   OR cover_url LIKE 'http://preview.kuanxue.com%'
   OR cover_url LIKE 'http://www.91pxb.com%'
   OR cover_url LIKE 'http://meethr.91pxb.com%'
   OR cover_url LIKE 'http://kuanxue-fsm.oss-cn-hangzhou.aliyuncs.com%'
   OR cover_url LIKE 'http://osscdn-training.ihr360.com%'
   OR cover_url LIKE 'http://ws1.witsharer.com%';

UPDATE videos
SET cover_url = REPLACE(cover_url, '//data/', '/data/'),
    updated_at = NOW()
WHERE cover_url LIKE '%//data/%';

-- video_series
UPDATE video_series
SET cover_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) REGEXP '^[0-9A-Fa-f]+-[0-9]+$';

UPDATE video_series
SET cover_url = CONCAT('https://cdn5-pxb-videos.taoke.com/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'taoke/covers/%';

UPDATE video_series
SET cover_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'taoke/upload/%';

UPDATE video_series
SET cover_url = CONCAT('https://www.taoke.com', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE '/attachments/%';

UPDATE video_series
SET cover_url = CONCAT('https://www.taoke.com/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'attachments/%'
  AND TRIM(cover_url) NOT LIKE 'http%';

UPDATE video_series
SET cover_url = REPLACE(cover_url, 'http://', 'https://'),
    updated_at = NOW()
WHERE cover_url LIKE 'http://www.taoke.com%'
   OR cover_url LIKE 'http://taoke.com%'
   OR cover_url LIKE 'http://cdn-static.taoke.com%'
   OR cover_url LIKE 'http://cdn5-pxb-videos.taoke.com%'
   OR cover_url LIKE 'http://preview.kuanxue.com%'
   OR cover_url LIKE 'http://www.91pxb.com%'
   OR cover_url LIKE 'http://meethr.91pxb.com%'
   OR cover_url LIKE 'http://kuanxue-fsm.oss-cn-hangzhou.aliyuncs.com%'
   OR cover_url LIKE 'http://osscdn-training.ihr360.com%'
   OR cover_url LIKE 'http://ws1.witsharer.com%';

UPDATE video_series
SET cover_url = REPLACE(cover_url, '//data/', '/data/'),
    updated_at = NOW()
WHERE cover_url LIKE '%//data/%';

-- video_chapters
UPDATE video_chapters
SET cover_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) REGEXP '^[0-9A-Fa-f]+-[0-9]+$';

UPDATE video_chapters
SET cover_url = CONCAT('https://cdn5-pxb-videos.taoke.com/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'taoke/covers/%';

UPDATE video_chapters
SET cover_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'taoke/upload/%';

UPDATE video_chapters
SET cover_url = CONCAT('https://www.taoke.com', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE '/attachments/%';

UPDATE video_chapters
SET cover_url = CONCAT('https://www.taoke.com/', TRIM(cover_url)),
    updated_at = NOW()
WHERE TRIM(cover_url) LIKE 'attachments/%'
  AND TRIM(cover_url) NOT LIKE 'http%';

UPDATE video_chapters
SET cover_url = REPLACE(cover_url, 'http://', 'https://'),
    updated_at = NOW()
WHERE cover_url LIKE 'http://www.taoke.com%'
   OR cover_url LIKE 'http://taoke.com%'
   OR cover_url LIKE 'http://cdn-static.taoke.com%'
   OR cover_url LIKE 'http://cdn5-pxb-videos.taoke.com%'
   OR cover_url LIKE 'http://preview.kuanxue.com%'
   OR cover_url LIKE 'http://www.91pxb.com%'
   OR cover_url LIKE 'http://meethr.91pxb.com%'
   OR cover_url LIKE 'http://kuanxue-fsm.oss-cn-hangzhou.aliyuncs.com%'
   OR cover_url LIKE 'http://osscdn-training.ihr360.com%'
   OR cover_url LIKE 'http://ws1.witsharer.com%';

UPDATE video_chapters
SET cover_url = REPLACE(cover_url, '//data/', '/data/'),
    updated_at = NOW()
WHERE cover_url LIKE '%//data/%';
