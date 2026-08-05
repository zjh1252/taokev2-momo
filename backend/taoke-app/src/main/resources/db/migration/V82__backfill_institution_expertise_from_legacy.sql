-- V82: backfill institution expertise/industry from legacy tables when available.

SET @legacy_member_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_member'
);
SET @legacy_cate_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_cate'
);
SET @legacy_trade_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_trade'
);

SET @sql := IF(@legacy_member_ok > 0 AND @legacy_cate_ok > 0,
'UPDATE user_institutions ui
INNER JOIN (
    SELECT
        m.id AS member_id,
        GROUP_CONCAT(DISTINCT sc.id ORDER BY sc.id SEPARATOR '','') AS specialty_ids
    FROM taoke.tk_member m
    INNER JOIN taoke.tk_cate tc
        ON FIND_IN_SET(tc.id, REPLACE(COALESCE(m.cid, ''''), '' '', '''')) > 0
    INNER JOIN taoke.tk_cate tl1
        ON tl1.id = CASE WHEN COALESCE(tc.sub, 0) > 0 THEN tc.sub ELSE tc.id END
    INNER JOIN sys_categories sc
        ON sc.type = ''TRAINER_EXPERTISE''
       AND sc.level = 1
       AND TRIM(sc.name) = TRIM(tl1.name)
    WHERE m.cid IS NOT NULL
      AND TRIM(m.cid) <> ''''
    GROUP BY m.id
) src ON src.member_id = ui.id
SET ui.specialties = src.specialty_ids,
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.public_list_eligible = 1
  AND (
      ui.specialties IS NULL
      OR TRIM(ui.specialties) = ''''
      OR ui.specialties NOT REGEXP ''^[0-9]+(,[0-9]+)*$''
  )',
'SELECT 1 AS flyway_v82_skip_institution_specialty_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@legacy_member_ok > 0 AND @legacy_trade_ok > 0,
'UPDATE user_institutions ui
INNER JOIN taoke.tk_member m ON m.id = ui.id
INNER JOIN taoke.tk_trade tt ON tt.id = CAST(m.trade AS UNSIGNED)
INNER JOIN sys_categories sc
    ON sc.type = ''TRAINER_INDUSTRY''
   AND sc.level = 1
   AND TRIM(sc.name) = TRIM(tt.name)
SET ui.industries = CAST(sc.id AS CHAR),
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.public_list_eligible = 1
  AND m.trade REGEXP ''^[0-9]+$''
  AND CAST(m.trade AS UNSIGNED) > 0
  AND (
      ui.industries IS NULL
      OR TRIM(ui.industries) = ''''
      OR ui.industries NOT REGEXP ''^[0-9]+(,[0-9]+)*$''
  )',
'SELECT 1 AS flyway_v82_skip_institution_trade_id_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@legacy_member_ok > 0,
'UPDATE user_institutions ui
INNER JOIN taoke.tk_member m ON m.id = ui.id
INNER JOIN sys_categories sc
    ON sc.type = ''TRAINER_INDUSTRY''
   AND sc.level = 1
   AND TRIM(sc.name) = TRIM(m.trade)
SET ui.industries = CAST(sc.id AS CHAR),
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.public_list_eligible = 1
  AND m.trade IS NOT NULL
  AND TRIM(m.trade) <> ''''
  AND m.trade NOT REGEXP ''^[0-9]+$''
  AND m.trade NOT LIKE ''%,%''
  AND (
      ui.industries IS NULL
      OR TRIM(ui.industries) = ''''
      OR ui.industries NOT REGEXP ''^[0-9]+(,[0-9]+)*$''
  )',
'SELECT 1 AS flyway_v82_skip_institution_trade_text_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
