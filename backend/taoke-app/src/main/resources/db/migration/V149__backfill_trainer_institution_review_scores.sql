-- 按已通过评价回填专家/机构综合评分
-- review_scope=TRAINER     => user_trainers.score（按 trainer_user_id = user_id）
-- review_scope=INSTITUTION => user_institutions.score（按 institution_id = id）
-- 无已通过评价时 score 置 0.00；同时与 comment_count 对齐重算

-- 1. 专家：先清零，再按 AVG(avg_score) 覆盖
UPDATE `user_trainers` SET `score` = 0.00;

UPDATE `user_trainers` t
JOIN (
    SELECT trainer_user_id,
           ROUND(AVG(avg_score), 2) AS avg_score,
           COUNT(*) AS cnt
    FROM `training_reviews`
    WHERE review_scope = 'TRAINER'
      AND status = 1
      AND trainer_user_id IS NOT NULL
    GROUP BY trainer_user_id
) r ON r.trainer_user_id = t.user_id
SET t.score = r.avg_score,
    t.comment_count = r.cnt;

-- 2. 机构：同理
UPDATE `user_institutions` SET `score` = 0.00;

UPDATE `user_institutions` i
JOIN (
    SELECT institution_id,
           ROUND(AVG(avg_score), 2) AS avg_score,
           COUNT(*) AS cnt
    FROM `training_reviews`
    WHERE review_scope = 'INSTITUTION'
      AND status = 1
      AND institution_id IS NOT NULL
    GROUP BY institution_id
) r ON r.institution_id = i.id
SET i.score = r.avg_score,
    i.comment_count = r.cnt;
