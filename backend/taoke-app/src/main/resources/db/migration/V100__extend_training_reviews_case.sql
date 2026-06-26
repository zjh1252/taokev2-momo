-- 培训评价扩展：CASE 范围 + 审核人记录
ALTER TABLE training_reviews
    ADD COLUMN case_id INT DEFAULT NULL COMMENT '被评案例 ID（review_scope=CASE 时必填）' AFTER institution_id,
    ADD COLUMN reviewed_by INT DEFAULT NULL COMMENT '审核人用户 ID' AFTER reject_reason,
    ADD COLUMN reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间' AFTER reviewed_by;

ALTER TABLE training_reviews
    ADD KEY idx_review_case (case_id),
    ADD KEY idx_review_reviewed_by (reviewed_by);
