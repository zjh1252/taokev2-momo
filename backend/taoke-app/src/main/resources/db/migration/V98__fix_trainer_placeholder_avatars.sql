-- V98: normalize trainer avatars; legacy member lookup runs only when source table exists.

UPDATE sys_users u
INNER JOIN user_trainers t ON t.user_id = u.id
SET u.avatar_url = CONCAT('https://www.taoke.com/', TRIM(LEADING '/' FROM u.avatar_url))
WHERE u.avatar_url IS NOT NULL
  AND TRIM(u.avatar_url) != ''
  AND u.avatar_url NOT LIKE 'http://%'
  AND u.avatar_url NOT LIKE 'https://%'
  AND u.avatar_url NOT LIKE '/uploads/%'
  AND u.avatar_url NOT LIKE '/statics/%'
  AND (
    u.avatar_url LIKE 'attachments/%'
    OR u.avatar_url LIKE 'u/%'
    OR u.avatar_url LIKE '/attachments/%'
    OR u.avatar_url LIKE '/u/%'
  );

UPDATE sys_users u
INNER JOIN user_trainers t ON t.user_id = u.id
SET u.avatar_url = REPLACE(REPLACE(u.avatar_url, 'http://www.taoke.com/', 'https://www.taoke.com/'), 'http://taoke.com/', 'https://www.taoke.com/')
WHERE u.avatar_url LIKE 'http://www.taoke.com/%'
   OR u.avatar_url LIKE 'http://taoke.com/%';

UPDATE sys_users u
INNER JOIN user_trainers t ON t.user_id = u.id
SET u.avatar_url = t.avatar
WHERE (u.avatar_url IS NULL OR TRIM(u.avatar_url) = '')
  AND t.avatar IS NOT NULL
  AND TRIM(t.avatar) != '';

SET @legacy_member_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_member'
);

SET @sql := IF(@legacy_member_ok > 0,
'UPDATE sys_users u
INNER JOIN user_trainers t ON t.user_id = u.id
INNER JOIN taoke.tk_member m ON m.id = u.id
SET u.avatar_url = CASE
    WHEN m.icon LIKE ''http%'' THEN REPLACE(REPLACE(m.icon, ''http://www.taoke.com/'', ''https://www.taoke.com/''), ''http://taoke.com/'', ''https://www.taoke.com/'')
    ELSE CONCAT(''https://www.taoke.com/'', TRIM(LEADING ''/'' FROM TRIM(m.icon)))
END
WHERE (
        u.avatar_url IS NULL
        OR TRIM(u.avatar_url) = ''''
        OR u.avatar_url LIKE ''%/middle/00/1.%''
        OR u.avatar_url LIKE ''%/middle/00/1''
    )
  AND TRIM(COALESCE(m.icon, '''')) != ''''
  AND m.icon NOT LIKE ''%/middle/00/1%''',
'SELECT 1 AS flyway_v98_skip_legacy_avatar_fix');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
