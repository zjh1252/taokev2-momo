-- V77: fix institution placeholder logos; legacy member lookup runs only when source table exists.

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

SET @legacy_member_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_member'
);

SET @sql := IF(@legacy_member_ok > 0,
'UPDATE user_institutions ui
INNER JOIN taoke.tk_member m ON m.id = ui.user_id
SET ui.logo_url = CASE
    WHEN m.icon LIKE ''http%'' THEN REPLACE(REPLACE(m.icon, ''http://www.taoke.com/'', ''https://www.taoke.com/''), ''http://taoke.com/'', ''https://www.taoke.com/'')
    ELSE CONCAT(''https://www.taoke.com/'', TRIM(LEADING ''/'' FROM TRIM(m.icon)))
END
WHERE ui.logo_url LIKE ''%/middle/00/1.%''
  AND TRIM(COALESCE(m.icon, '''')) != ''''
  AND m.icon NOT LIKE ''%/middle/00/1%''',
'SELECT 1 AS flyway_v77_skip_legacy_logo_fix');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
