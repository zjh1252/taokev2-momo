-- 线下公开课到期前台自动隐藏：结束日期 + 是否自动隐藏开关
ALTER TABLE courses
    ADD COLUMN course_open_end_date DATE NULL DEFAULT NULL COMMENT '线下公开课结束日期（最晚场次 end_time 的日期部分）' AFTER published_at,
    ADD COLUMN is_expire_hide TINYINT(1) NOT NULL DEFAULT 1 COMMENT '到期是否前台自动隐藏：1=是 0=否' AFTER course_open_end_date;

-- 从已有开课计划回填线下公开课结束日期
UPDATE courses c
SET c.course_open_end_date = (
    SELECT DATE(MAX(cp.end_time))
    FROM course_plans cp
    WHERE cp.course_id = c.id
)
WHERE c.type = 'OPEN_OFFLINE';

CREATE INDEX idx_course_open_expire ON courses (type, is_expire_hide, course_open_end_date);
