-- 录播课播放地址 video_url 规范化（V67 仅处理 cover_url，播放地址仍为 OSS 相对路径）
-- 对齐老站 videoPlayUrl() 与 PXB CDN：https://cdn5-pxb-videos.taoke.com/

-- videos：taoke/*、videos/* 相对路径
UPDATE videos
SET video_url = CONCAT('https://cdn5-pxb-videos.taoke.com/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'taoke/%'
  AND TRIM(video_url) NOT LIKE 'http%';

UPDATE videos
SET video_url = CONCAT('https://cdn5-pxb-videos.taoke.com/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'videos/%'
  AND TRIM(video_url) NOT LIKE 'http%';

-- videos：FSM key、taoke/upload
UPDATE videos
SET video_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) REGEXP '^[0-9A-Fa-f]+-[0-9]+$';

UPDATE videos
SET video_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'taoke/upload/%'
  AND TRIM(video_url) NOT LIKE 'http%';

-- videos：纯 32 位 MD5 → old-videos
UPDATE videos
SET video_url = CONCAT('https://cdn5-pxb-videos.taoke.com/taoke/old-videos/videos/', TRIM(video_url), '.mp4'),
    updated_at = NOW()
WHERE TRIM(video_url) REGEXP '^[a-f0-9]{32}$';

-- videos：旧站 attachments
UPDATE videos
SET video_url = CONCAT('https://www.taoke.com', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE '/attachments/%';

UPDATE videos
SET video_url = CONCAT('https://www.taoke.com/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'attachments/%'
  AND TRIM(video_url) NOT LIKE 'http%';

-- video_chapters：taoke/*、videos/*
UPDATE video_chapters
SET video_url = CONCAT('https://cdn5-pxb-videos.taoke.com/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'taoke/%'
  AND TRIM(video_url) NOT LIKE 'http%';

UPDATE video_chapters
SET video_url = CONCAT('https://cdn5-pxb-videos.taoke.com/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'videos/%'
  AND TRIM(video_url) NOT LIKE 'http%';

-- video_chapters：FSM key、taoke/upload
UPDATE video_chapters
SET video_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) REGEXP '^[0-9A-Fa-f]+-[0-9]+$';

UPDATE video_chapters
SET video_url = CONCAT('https://preview.kuanxue.com/fsm/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'taoke/upload/%'
  AND TRIM(video_url) NOT LIKE 'http%';

-- video_chapters：纯 32 位 MD5 → old-videos
UPDATE video_chapters
SET video_url = CONCAT('https://cdn5-pxb-videos.taoke.com/taoke/old-videos/videos/', TRIM(video_url), '.mp4'),
    updated_at = NOW()
WHERE TRIM(video_url) REGEXP '^[a-f0-9]{32}$';

-- video_chapters：旧站 attachments
UPDATE video_chapters
SET video_url = CONCAT('https://www.taoke.com', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE '/attachments/%';

UPDATE video_chapters
SET video_url = CONCAT('https://www.taoke.com/', TRIM(video_url)),
    updated_at = NOW()
WHERE TRIM(video_url) LIKE 'attachments/%'
  AND TRIM(video_url) NOT LIKE 'http%';

-- http → https（与 V67 封面规则一致）
UPDATE videos
SET video_url = REPLACE(video_url, 'http://', 'https://'),
    updated_at = NOW()
WHERE video_url LIKE 'http://www.taoke.com%'
   OR video_url LIKE 'http://taoke.com%'
   OR video_url LIKE 'http://cdn5-pxb-videos.taoke.com%'
   OR video_url LIKE 'http://preview.kuanxue.com%';

UPDATE video_chapters
SET video_url = REPLACE(video_url, 'http://', 'https://'),
    updated_at = NOW()
WHERE video_url LIKE 'http://www.taoke.com%'
   OR video_url LIKE 'http://taoke.com%'
   OR video_url LIKE 'http://cdn5-pxb-videos.taoke.com%'
   OR video_url LIKE 'http://preview.kuanxue.com%';
