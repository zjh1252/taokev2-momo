-- ------------------------------------------------------------
-- V132: 企业培训采购方资质认证（实名认证 + 工作认证）
-- 状态机：NULL=未提交 1=待审核 2=已通过 3=已驳回
-- ------------------------------------------------------------

ALTER TABLE `user_enterprise_buyers`
    ADD COLUMN `id_card_no`               VARCHAR(32)  NULL DEFAULT ''   COMMENT '身份证号'                              AFTER `training_tags`,
    ADD COLUMN `id_card_front`            VARCHAR(500) NULL DEFAULT ''   COMMENT '身份证人像面 URL'                      AFTER `id_card_no`,
    ADD COLUMN `id_card_back`             VARCHAR(500) NULL DEFAULT ''   COMMENT '身份证国徽面 URL'                      AFTER `id_card_front`,
    ADD COLUMN `real_name_status`         TINYINT      NULL DEFAULT NULL COMMENT '实名认证状态：NULL未提交 1待审核 2已通过 3已驳回' AFTER `id_card_back`,
    ADD COLUMN `real_name_reject_reason`  VARCHAR(255) NULL DEFAULT ''   COMMENT '实名认证驳回原因'                        AFTER `real_name_status`,
    ADD COLUMN `real_name_submitted_at`   DATETIME     NULL DEFAULT NULL COMMENT '实名认证最近一次提交时间'                 AFTER `real_name_reject_reason`,
    ADD COLUMN `real_name_audited_at`     DATETIME     NULL DEFAULT NULL COMMENT '实名认证最近一次审核时间'                 AFTER `real_name_submitted_at`,
    ADD INDEX `idx_real_name_status` (`real_name_status`);

CREATE TABLE IF NOT EXISTS `enterprise_buyer_work_experiences`
(
    `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `buyer_id`        INT          NOT NULL COMMENT '企业采购方扩展表 user_enterprise_buyers.id',
    `company_name`    VARCHAR(200) NOT NULL                  COMMENT '单位名称',
    `position`        VARCHAR(100) NULL DEFAULT ''           COMMENT '担任职务',
    `start_date`      DATE         NOT NULL                  COMMENT '起始日期',
    `end_date`        DATE         NULL DEFAULT NULL         COMMENT '结束日期，NULL=至今',
    `job_description` TEXT         NULL                      COMMENT '工作描述',
    `proof_file`      VARCHAR(500) NULL DEFAULT ''           COMMENT '证明文件 URL（劳动合同/名片/工牌等）',
    `status`          TINYINT      NOT NULL DEFAULT 1        COMMENT '审核状态：1待审核 2已通过 3已驳回',
    `reject_reason`   VARCHAR(255) NULL DEFAULT ''           COMMENT '驳回原因',
    `submitted_at`    DATETIME     NULL DEFAULT NULL         COMMENT '最近一次提交时间',
    `audited_at`      DATETIME     NULL DEFAULT NULL         COMMENT '最近一次审核时间',
    `sort_order`      INT          NOT NULL DEFAULT 0        COMMENT '排序值',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                COMMENT '创建时间',
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_buyer_id` (`buyer_id`),
    KEY `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='企业采购方工作认证记录';
