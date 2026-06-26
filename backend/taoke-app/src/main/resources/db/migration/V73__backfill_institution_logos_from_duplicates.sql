-- V73：补全机构 Logo（partner 低 id 行常为空，从同名 organ 行或 tk_member.icon 回填）

-- 1) 同名机构：从已有 logo 的行复制（优先 id 较大 organ 行）
UPDATE user_institutions ui
INNER JOIN (
    SELECT org_name, logo_url
    FROM (
        SELECT org_name,
               logo_url,
               ROW_NUMBER() OVER (PARTITION BY org_name ORDER BY id DESC) AS rn
        FROM user_institutions
        WHERE TRIM(COALESCE(logo_url, '')) != ''
    ) ranked
    WHERE rn = 1
) src ON src.org_name = ui.org_name
SET ui.logo_url = src.logo_url
WHERE TRIM(COALESCE(ui.logo_url, '')) = ''
  AND ui.status = 1;

-- 2) 相对路径规范为 https（与 V72 一致，幂等）
UPDATE user_institutions
SET logo_url = CONCAT('https://www.taoke.com/', TRIM(LEADING '/' FROM logo_url))
WHERE logo_url IS NOT NULL
  AND TRIM(logo_url) != ''
  AND logo_url NOT LIKE 'http://%'
  AND logo_url NOT LIKE 'https://%'
  AND logo_url NOT LIKE '/uploads/%'
  AND logo_url NOT LIKE '/statics/%'
  AND (
    logo_url LIKE 'attachments/%'
    OR logo_url LIKE 'u/%'
    OR logo_url LIKE '/attachments/%'
    OR logo_url LIKE '/u/%'
  );

UPDATE user_institutions
SET logo_url = REPLACE(logo_url, 'http://www.taoke.com/', 'https://www.taoke.com/')
WHERE logo_url LIKE 'http://www.taoke.com/%'
   OR logo_url LIKE 'http://taoke.com/%';
