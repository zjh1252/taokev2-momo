-- V132 在部分库 flyway 已记录但 DDL 未落库（历史脚本 uc_org_member_links 与现仓库 V132 不一致）
-- 幂等补全：企业采购方实名认证字段 + 工作认证表
-- 可重复执行

SET @db := DATABASE();

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND COLUMN_NAME = 'id_card_no') = 0,
        'ALTER TABLE user_enterprise_buyers ADD COLUMN id_card_no VARCHAR(32) NULL DEFAULT '''' COMMENT ''身份证号'' AFTER training_tags',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND COLUMN_NAME = 'id_card_front') = 0,
        'ALTER TABLE user_enterprise_buyers ADD COLUMN id_card_front VARCHAR(500) NULL DEFAULT '''' COMMENT ''身份证人像面 URL'' AFTER id_card_no',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND COLUMN_NAME = 'id_card_back') = 0,
        'ALTER TABLE user_enterprise_buyers ADD COLUMN id_card_back VARCHAR(500) NULL DEFAULT '''' COMMENT ''身份证国徽面 URL'' AFTER id_card_front',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND COLUMN_NAME = 'real_name_status') = 0,
        'ALTER TABLE user_enterprise_buyers ADD COLUMN real_name_status TINYINT NULL DEFAULT NULL COMMENT ''实名认证状态：NULL未提交 1待审核 2已通过 3已驳回'' AFTER id_card_back',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND COLUMN_NAME = 'real_name_reject_reason') = 0,
        'ALTER TABLE user_enterprise_buyers ADD COLUMN real_name_reject_reason VARCHAR(255) NULL DEFAULT '''' COMMENT ''实名认证驳回原因'' AFTER real_name_status',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND COLUMN_NAME = 'real_name_submitted_at') = 0,
        'ALTER TABLE user_enterprise_buyers ADD COLUMN real_name_submitted_at DATETIME NULL DEFAULT NULL COMMENT ''实名认证最近一次提交时间'' AFTER real_name_reject_reason',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND COLUMN_NAME = 'real_name_audited_at') = 0,
        'ALTER TABLE user_enterprise_buyers ADD COLUMN real_name_audited_at DATETIME NULL DEFAULT NULL COMMENT ''实名认证最近一次审核时间'' AFTER real_name_submitted_at',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
        (SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'user_enterprise_buyers' AND INDEX_NAME = 'idx_real_name_status') = 0,
        'CREATE INDEX idx_real_name_status ON user_enterprise_buyers (real_name_status)',
        'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS enterprise_buyer_work_experiences
(
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    buyer_id        INT          NOT NULL COMMENT '企业采购方扩展表 user_enterprise_buyers.id',
    company_name    VARCHAR(200) NOT NULL                  COMMENT '单位名称',
    position        VARCHAR(100) NULL DEFAULT ''           COMMENT '担任职务',
    start_date      DATE         NOT NULL                  COMMENT '起始日期',
    end_date        DATE         NULL DEFAULT NULL         COMMENT '结束日期，NULL=至今',
    job_description TEXT         NULL                      COMMENT '工作描述',
    proof_file      VARCHAR(500) NULL DEFAULT ''           COMMENT '证明文件 URL（劳动合同/名片/工牌等）',
    status          TINYINT      NOT NULL DEFAULT 1        COMMENT '审核状态：1待审核 2已通过 3已驳回',
    reject_reason   VARCHAR(255) NULL DEFAULT ''           COMMENT '驳回原因',
    submitted_at    DATETIME     NULL DEFAULT NULL         COMMENT '最近一次提交时间',
    audited_at      DATETIME     NULL DEFAULT NULL         COMMENT '最近一次审核时间',
    sort_order      INT          NOT NULL DEFAULT 0        COMMENT '排序值',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                COMMENT '创建时间',
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_buyer_id (buyer_id),
    KEY idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='企业采购方工作认证记录';
