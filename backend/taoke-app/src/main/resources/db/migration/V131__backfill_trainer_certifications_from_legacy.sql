-- 专家资质认证：从老库 tk_member_authinfo / tk_member_education / tk_member_work 回填
-- 依赖同实例老库 taoke；与 V68 一致，user_trainers.id = tk_member.id（迁库 uid）
-- 无 taoke 库时整脚本跳过（纯新库 / CI 可正常启动）
-- 可重复执行（仅补空字段 / 修正错误状态）

SET @legacy_ok := (
    SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'taoke'
);

-- ============================================================
-- 1. 实名认证（type = ID / identity）
-- ============================================================
SET @sql := IF(@legacy_ok > 0,
'UPDATE user_trainers t
INNER JOIN (
    SELECT ai.uid, MAX(ai.id) AS latest_id
    FROM taoke.tk_member_authinfo ai
    WHERE ai.type IN (''ID'', ''identity'')
      AND (TRIM(IFNULL(ai.IDcode, '''')) <> ''''
           OR TRIM(IFNULL(ai.IDpic1, '''')) <> ''''
           OR TRIM(IFNULL(ai.IDpic2, '''')) <> '''')
    GROUP BY ai.uid
) pick ON pick.uid = t.id
INNER JOIN taoke.tk_member_authinfo ai ON ai.id = pick.latest_id
SET t.id_card_no = CASE
        WHEN TRIM(IFNULL(t.id_card_no, '''')) = '''' AND TRIM(IFNULL(ai.IDcode, '''')) <> ''''
            THEN TRIM(ai.IDcode) ELSE t.id_card_no END,
    t.id_card_front = CASE
        WHEN TRIM(IFNULL(t.id_card_front, '''')) = '''' AND TRIM(IFNULL(ai.IDpic1, '''')) <> ''''
            THEN TRIM(ai.IDpic1) ELSE t.id_card_front END,
    t.id_card_back = CASE
        WHEN TRIM(IFNULL(t.id_card_back, '''')) = '''' AND TRIM(IFNULL(ai.IDpic2, '''')) <> ''''
            THEN TRIM(ai.IDpic2) ELSE t.id_card_back END,
    t.real_name_status = CASE
        WHEN t.real_name_status IS NULL THEN
            CASE ai.isapprove WHEN 1 THEN 2 WHEN -1 THEN 3 ELSE 1 END
        WHEN t.real_name_status = 1
             AND TRIM(IFNULL(t.id_card_front, '''')) = ''''
             AND TRIM(IFNULL(t.id_card_no, '''')) = '''' THEN
            CASE ai.isapprove WHEN 1 THEN 2 WHEN -1 THEN 3 ELSE t.real_name_status END
        ELSE t.real_name_status END,
    t.real_name_audited_at = CASE
        WHEN t.real_name_audited_at IS NULL AND ai.isapprove IN (1, -1) AND ai.ctime > 0
            THEN FROM_UNIXTIME(ai.ctime) ELSE t.real_name_audited_at END,
    t.updated_at = NOW()
WHERE t.status = 2',
'SELECT 1 AS flyway_v131_skip_real_name_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@legacy_ok > 0,
'UPDATE user_trainers t
SET t.real_name_status = NULL, t.updated_at = NOW()
WHERE t.real_name_status = 1
  AND TRIM(IFNULL(t.id_card_no, '''')) = ''''
  AND TRIM(IFNULL(t.id_card_front, '''')) = ''''
  AND TRIM(IFNULL(t.id_card_back, '''')) = ''''
  AND NOT EXISTS (
      SELECT 1 FROM taoke.tk_member_authinfo ai
      WHERE ai.uid = t.id AND ai.type IN (''ID'', ''identity'')
        AND (TRIM(IFNULL(ai.IDcode, '''')) <> ''''
             OR TRIM(IFNULL(ai.IDpic1, '''')) <> ''''
             OR TRIM(IFNULL(ai.IDpic2, '''')) <> '''')
  )',
'SELECT 1 AS flyway_v131_skip_phantom_real_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. 学历认证
-- ============================================================
SET @sql := IF(@legacy_ok > 0,
'UPDATE trainer_educations te
INNER JOIN user_trainers t ON t.id = te.trainer_id AND t.status = 2
INNER JOIN taoke.tk_member_education me
    ON me.uid = te.trainer_id
   AND TRIM(me.edu_school) = TRIM(te.school_name)
   AND me.is_deleted = 0
SET te.proof_file = CASE
        WHEN TRIM(IFNULL(te.proof_file, '''')) = '''' AND TRIM(IFNULL(me.edu_caimg, '''')) <> ''''
            THEN TRIM(me.edu_caimg) ELSE te.proof_file END,
    te.holder_name = CASE
        WHEN TRIM(IFNULL(te.holder_name, '''')) = '''' AND TRIM(IFNULL(me.edu_caname, '''')) <> ''''
            THEN TRIM(me.edu_caname) ELSE te.holder_name END,
    te.major = CASE
        WHEN TRIM(IFNULL(te.major, '''')) = '''' AND TRIM(IFNULL(me.edu_major, '''')) <> ''''
            THEN TRIM(me.edu_major) ELSE te.major END,
    te.status = CASE me.status WHEN 1 THEN 2 WHEN -1 THEN 3 ELSE te.status END,
    te.audited_at = CASE
        WHEN te.audited_at IS NULL AND me.edu_approvetime > 0
            THEN FROM_UNIXTIME(me.edu_approvetime) ELSE te.audited_at END,
    te.updated_at = NOW()
WHERE TRIM(IFNULL(me.edu_caimg, '''')) <> '''' OR me.status IN (1, -1)',
'SELECT 1 AS flyway_v131_skip_education_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. 工作认证
-- ============================================================
SET @sql := IF(@legacy_ok > 0,
'UPDATE trainer_work_experiences tw
INNER JOIN user_trainers t ON t.id = tw.trainer_id AND t.status = 2
INNER JOIN taoke.tk_member_work mw
    ON mw.uid = tw.trainer_id
   AND TRIM(mw.wk_company) = TRIM(tw.company_name)
   AND mw.is_deleted = 0
SET tw.proof_file = CASE
        WHEN TRIM(IFNULL(tw.proof_file, '''')) = '''' AND TRIM(IFNULL(mw.wk_caimg, '''')) <> ''''
            THEN TRIM(mw.wk_caimg) ELSE tw.proof_file END,
    tw.status = CASE mw.status WHEN 1 THEN 2 WHEN -1 THEN 3 ELSE tw.status END,
    tw.audited_at = CASE
        WHEN tw.audited_at IS NULL AND mw.wk_approvetime > 0
            THEN FROM_UNIXTIME(mw.wk_approvetime) ELSE tw.audited_at END,
    tw.updated_at = NOW()
WHERE TRIM(IFNULL(mw.wk_caimg, '''')) <> '''' OR mw.status IN (1, -1)',
'SELECT 1 AS flyway_v131_skip_work_backfill');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
