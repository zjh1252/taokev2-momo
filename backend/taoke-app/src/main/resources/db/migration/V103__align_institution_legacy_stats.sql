-- V103: align institution legacy fields when legacy source tables are available.

ALTER TABLE user_institutions
    ADD COLUMN legacy_role_id INT NOT NULL DEFAULT 0
        COMMENT 'legacy tk_member.roleid for /company/{roleid}.htm'
    AFTER user_id;

CREATE INDEX idx_user_institutions_legacy_role_id
    ON user_institutions (legacy_role_id, status, public_list_eligible);

SET @legacy_member_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_member'
);
SET @legacy_statistics_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_statistics'
);
SET @legacy_comment_company_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_comment_course_company'
);

SET @sql := CASE
    WHEN @legacy_member_ok > 0 AND @legacy_statistics_ok > 0 THEN
'UPDATE user_institutions ui
    INNER JOIN taoke.tk_member m ON m.id = ui.user_id AND m.groupid = 3
    LEFT JOIN taoke.tk_statistics s ON s.uid = m.id AND s.groupid = 3
SET ui.legacy_role_id = m.roleid,
    ui.open_course_count = COALESCE(s.opencourse_num, ui.open_course_count),
    ui.inner_course_count = COALESCE(s.training_num, ui.inner_course_count),
    ui.view_count = GREATEST(ui.view_count, COALESCE(m.clicknum, 0)),
    ui.updated_at = NOW()
WHERE ui.status = 1'
    WHEN @legacy_member_ok > 0 THEN
'UPDATE user_institutions ui
    INNER JOIN taoke.tk_member m ON m.id = ui.user_id AND m.groupid = 3
SET ui.legacy_role_id = m.roleid,
    ui.view_count = GREATEST(ui.view_count, COALESCE(m.clicknum, 0)),
    ui.updated_at = NOW()
WHERE ui.status = 1'
    ELSE 'SELECT 1 AS flyway_v103_skip_institution_member_stats'
END;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := CASE
    WHEN @legacy_member_ok > 0 AND @legacy_statistics_ok > 0 THEN
'UPDATE user_institutions ui
    INNER JOIN taoke.tk_member m ON m.id = ui.id AND m.groupid = 3
    LEFT JOIN taoke.tk_statistics s ON s.uid = m.id AND s.groupid = 3
SET ui.legacy_role_id = IF(ui.legacy_role_id > 0, ui.legacy_role_id, m.roleid),
    ui.open_course_count = COALESCE(s.opencourse_num, ui.open_course_count),
    ui.inner_course_count = COALESCE(s.training_num, ui.inner_course_count),
    ui.view_count = GREATEST(ui.view_count, COALESCE(m.clicknum, 0)),
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.id = ui.user_id
  AND (ui.legacy_role_id = 0 OR ui.open_course_count = 0)'
    WHEN @legacy_member_ok > 0 THEN
'UPDATE user_institutions ui
    INNER JOIN taoke.tk_member m ON m.id = ui.id AND m.groupid = 3
SET ui.legacy_role_id = IF(ui.legacy_role_id > 0, ui.legacy_role_id, m.roleid),
    ui.view_count = GREATEST(ui.view_count, COALESCE(m.clicknum, 0)),
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.id = ui.user_id
  AND ui.legacy_role_id = 0'
    ELSE 'SELECT 1 AS flyway_v103_skip_institution_member_stats_by_id'
END;
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@legacy_comment_company_ok > 0,
'UPDATE user_institutions ui
    INNER JOIN taoke.tk_comment_course_company ccc ON ccc.user_id = ui.user_id
SET ui.score = GREATEST(ui.score, ROUND(COALESCE(ccc.c_all_av, 0), 2)),
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND COALESCE(ccc.c_all_av, 0) > 0',
'SELECT 1 AS flyway_v103_skip_institution_comment_score');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE user_institutions ui
    INNER JOIN (
        SELECT org_name,
               CAST(SUBSTRING_INDEX(
                   GROUP_CONCAT(id ORDER BY
                       CASE WHEN id = user_id THEN 0 ELSE 1 END,
                       view_count DESC,
                       id DESC),
                   ',', 1) AS UNSIGNED) AS keep_id
        FROM user_institutions
        WHERE status = 1
        GROUP BY org_name
        HAVING COUNT(*) > 1
    ) d ON d.org_name = ui.org_name AND ui.id <> d.keep_id
SET ui.public_list_eligible = 0,
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.public_list_eligible = 1;

UPDATE user_institutions ui
    INNER JOIN (
        SELECT org_name,
               CAST(SUBSTRING_INDEX(
                   GROUP_CONCAT(id ORDER BY
                       CASE WHEN id = user_id THEN 0 ELSE 1 END,
                       view_count DESC,
                       id DESC),
                   ',', 1) AS UNSIGNED) AS keep_id
        FROM user_institutions
        WHERE status = 1
        GROUP BY org_name
        HAVING COUNT(*) > 1
    ) c ON c.org_name = ui.org_name
SET ui.comment_count = 0,
    ui.updated_at = NOW()
WHERE ui.status = 1;

UPDATE training_reviews r
    INNER JOIN user_institutions ui ON ui.id = r.institution_id
    INNER JOIN (
        SELECT org_name,
               CAST(SUBSTRING_INDEX(
                   GROUP_CONCAT(id ORDER BY
                       CASE WHEN id = user_id THEN 0 ELSE 1 END,
                       view_count DESC,
                       id DESC),
                   ',', 1) AS UNSIGNED) AS keep_id
        FROM user_institutions
        WHERE status = 1
        GROUP BY org_name
        HAVING COUNT(*) > 1
    ) c ON c.org_name = ui.org_name AND r.institution_id <> c.keep_id
SET r.institution_id = c.keep_id
WHERE r.review_scope = 'INSTITUTION'
  AND r.institution_id IS NOT NULL;

UPDATE user_institutions i
    LEFT JOIN (
        SELECT institution_id, COUNT(*) AS cnt
        FROM training_reviews
        WHERE review_scope = 'INSTITUTION'
          AND status = 1
          AND institution_id IS NOT NULL
        GROUP BY institution_id
    ) r ON r.institution_id = i.id
SET i.comment_count = COALESCE(r.cnt, 0),
    i.updated_at = NOW()
WHERE i.status = 1;
