-- V150：纠正迁库评价 scope 并回填专家综合评分
-- 背景：
--   老站 to_userid 写入 training_reviews.trainer_user_id 后，大量专家评价被标成
--   review_scope=COURSE 且 course_id IS NULL（机构侧已由 V104 归并为 INSTITUTION）。
--   V149 仅按 TRAINER scope 回填 score，导致几乎全部专家 score 被清成 0.00。
-- 本脚本：
--   1) 将 COURSE + course_id IS NULL + 对应专家 的评价归并为 TRAINER
--   2) 按已通过 TRAINER 评价重算 user_trainers.score / comment_count

-- 1. 归并误标为 COURSE 的专家评价
UPDATE training_reviews tr
INNER JOIN user_trainers t ON t.user_id = tr.trainer_user_id
SET tr.review_scope = 'TRAINER',
    tr.updated_at = NOW()
WHERE tr.review_scope = 'COURSE'
  AND tr.course_id IS NULL
  AND tr.trainer_user_id IS NOT NULL;

-- 2. 重算专家评分与评价数
UPDATE `user_trainers`
SET `score` = 0.00,
    `comment_count` = 0;

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
