-- V77：机构 Logo 占位图 middle/00/1.jpg → 同名机构真实 logo 或 tk_member.icon

-- 1) 默认占位图：从同名机构复制真实 logo（优先 view_count 高、id 大）
UPDATE user_institutions ui
INNER JOIN (
    SELECT org_name, logo_url
    FROM (
        SELECT org_name,
               logo_url,
               ROW_NUMBER() OVER (PARTITION BY org_name ORDER BY view_count DESC, id DESC) AS rn
        FROM user_institutions
        WHERE TRIM(COALESCE(logo_url, '')) != ''
          AND logo_url NOT LIKE '%/middle/00/1.%'
          AND logo_url NOT LIKE '%/middle/00/1'
    ) ranked
    WHERE rn = 1
) src ON src.org_name = ui.org_name
SET ui.logo_url = src.logo_url
WHERE ui.logo_url LIKE '%/middle/00/1.%'
  AND ui.status = 1;

-- 2) 仍为占位图：按 user_id 关联 tk_member.icon
UPDATE user_institutions ui
INNER JOIN taoke.tk_member m ON m.id = ui.user_id
SET ui.logo_url = CASE
    WHEN m.icon LIKE 'http%' THEN REPLACE(REPLACE(m.icon, 'http://www.taoke.com/', 'https://www.taoke.com/'), 'http://taoke.com/', 'https://www.taoke.com/')
    ELSE CONCAT('https://www.taoke.com/', TRIM(LEADING '/' FROM TRIM(m.icon)))
END
WHERE ui.logo_url LIKE '%/middle/00/1.%'
  AND TRIM(COALESCE(m.icon, '')) != ''
  AND m.icon NOT LIKE '%/middle/00/1%';
