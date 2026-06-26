-- 发票申请状态语义调整：0待审核 1开具中 2已开具 3开具失败 4已驳回
ALTER TABLE invoice_requests
    ADD COLUMN reject_reason VARCHAR(500) NOT NULL DEFAULT '' COMMENT '驳回原因' AFTER status,
    ADD COLUMN issued_at DATETIME NULL COMMENT '开具完成时间' AFTER reject_reason,
    ADD COLUMN invoice_file_url VARCHAR(500) NOT NULL DEFAULT '' COMMENT '发票文件 URL' AFTER issued_at;

-- 先迁移已驳回，再迁移已开具，避免冲突
UPDATE invoice_requests SET status = 4 WHERE status = 2;
UPDATE invoice_requests SET status = 2 WHERE status = 1;
