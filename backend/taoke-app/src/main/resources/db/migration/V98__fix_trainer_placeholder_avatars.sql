-- V98：专家头像 — 占位图 middle/00/1、空值、相对路径修复；从 user_trainers.avatar / tk_member.icon 回填

-- 1) 相对路径 → https 绝对 URL
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

-- 2) 用户头像为空：迁自 user_trainers.avatar
UPDATE sys_users u
INNER JOIN user_trainers t ON t.user_id = u.id
SET u.avatar_url = t.avatar
WHERE (u.avatar_url IS NULL OR TRIM(u.avatar_url) = '')
  AND t.avatar IS NOT NULL
  AND TRIM(t.avatar) != '';

-- 3) 仍为占位或空：从老库 tk_member.icon 回填
UPDATE sys_users u
INNER JOIN user_trainers t ON t.user_id = u.id
INNER JOIN taoke.tk_member m ON m.id = u.id
SET u.avatar_url = CASE
    WHEN m.icon LIKE 'http%' THEN REPLACE(REPLACE(m.icon, 'http://www.taoke.com/', 'https://www.taoke.com/'), 'http://taoke.com/', 'https://www.taoke.com/')
    ELSE CONCAT('https://www.taoke.com/', TRIM(LEADING '/' FROM TRIM(m.icon)))
END
WHERE (
        u.avatar_url IS NULL
        OR TRIM(u.avatar_url) = ''
        OR u.avatar_url LIKE '%/middle/00/1.%'
        OR u.avatar_url LIKE '%/middle/00/1'
    )
  AND TRIM(COALESCE(m.icon, '')) != ''
  AND m.icon NOT LIKE '%/middle/00/1%';
