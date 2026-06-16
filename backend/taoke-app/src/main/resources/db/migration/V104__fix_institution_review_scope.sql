-- V104：机构评论对齐老站 getInstutionList()
-- 老站：commentnum = COUNT(tk_comment_course WHERE to_userid = tk_member.id AND 已通过/公开)
-- 迁库时 to_userid 被写入 training_reviews.trainer_user_id，review_scope 误标为 COURSE 且 course_id 为空
-- 本脚本：仅当 trainer_user_id 对应机构 user_id 时，归并为 INSTITUTION 评价并重算 comment_count

UPDATE training_reviews tr
    INNER JOIN user_institutions ui ON ui.user_id = tr.trainer_user_id AND ui.status = 1
SET tr.review_scope = 'INSTITUTION',
    tr.institution_id = ui.id,
    tr.updated_at = NOW()
WHERE tr.review_scope = 'COURSE'
  AND tr.course_id IS NULL
  AND tr.institution_id IS NULL
  AND tr.trainer_user_id IS NOT NULL;

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
