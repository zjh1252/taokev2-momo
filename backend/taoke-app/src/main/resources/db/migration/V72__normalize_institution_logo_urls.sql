-- 机构 Logo：attachments/、u/ 相对路径 → 完整 https URL（与 V67 录播封面一致）

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
