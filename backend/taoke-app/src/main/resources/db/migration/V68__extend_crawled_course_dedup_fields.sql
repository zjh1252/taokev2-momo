-- ============================================================
-- V68: 扩展爬取课程去重目标字段
--   支持同时指向正式课程和其他待审核爬取课程，并保留匹配规则、分数和检查时间。
-- ============================================================

ALTER TABLE crawled_courses
    ADD COLUMN dedup_target_type VARCHAR(32) NULL COMMENT '重复目标类型：COURSE/CRAWLED_COURSE' AFTER dedup_course_id,
    ADD COLUMN dedup_target_id INT NULL COMMENT '重复目标 ID' AFTER dedup_target_type,
    ADD COLUMN dedup_match_type VARCHAR(64) NULL COMMENT '去重匹配规则' AFTER dedup_target_id,
    ADD COLUMN dedup_score INT NULL COMMENT '去重匹配分数 0-100' AFTER dedup_match_type,
    ADD COLUMN dedup_checked_at DATETIME NULL COMMENT '最近一次去重检查时间' AFTER dedup_score,
    ADD INDEX idx_dedup_target (dedup_target_type, dedup_target_id),
    ADD INDEX idx_dedup_checked_at (dedup_checked_at);
