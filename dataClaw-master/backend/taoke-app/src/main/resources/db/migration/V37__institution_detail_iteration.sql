-- 机构详情页迭代：扩展机构成功案例字段、为课程新增最近报名时间字段、为评价支持机构维度

-- 1. 机构主表新增「成功案例」长文本
ALTER TABLE user_institutions
    ADD COLUMN success_cases TEXT NULL COMMENT '成功案例（长文本，机构详情页对外展示）' AFTER client_cases;

-- 2. 课程主表新增「最近报名时间」用于排序，并按已有报名记录回填一次
ALTER TABLE courses
    ADD COLUMN last_enrolled_at DATETIME NULL COMMENT '最近一次报名时间，用于近期热度排序' AFTER enrollment_count;

UPDATE courses c
LEFT JOIN (
    SELECT course_id, MAX(enrolled_at) AS max_enrolled_at
    FROM course_enrollments
    WHERE status = 1
    GROUP BY course_id
) e ON e.course_id = c.id
SET c.last_enrolled_at = e.max_enrolled_at
WHERE e.max_enrolled_at IS NOT NULL;

CREATE INDEX idx_courses_last_enrolled_at ON courses (last_enrolled_at);

-- 3. 培训评价表支持机构维度
ALTER TABLE training_reviews
    ADD COLUMN institution_id INT NULL COMMENT '被评机构 ID（review_scope=INSTITUTION 时必填，关联 user_institutions.id）' AFTER trainer_user_id;

CREATE INDEX idx_training_reviews_inst_status_created
    ON training_reviews (review_scope, institution_id, status, created_at);
